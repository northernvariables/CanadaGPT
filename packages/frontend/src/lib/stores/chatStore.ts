/**
 * Chat Store - Zustand state management for AI chat
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  ChatState,
  ChatActions,
  Conversation,
  Message,
  UserSubscription,
  QuotaCheckResult,
  UsageStats,
  ContextType,
} from '@/lib/types/chat';

interface ChatStore extends ChatState, ChatActions {}

const initialState: ChatState = {
  conversation: null,
  messages: [],
  input: '',
  isLoading: false,
  error: null,
  subscription: null,
  quotaStatus: null,
  usageStats: null,
  hasAnthropicKey: false,
  hasOpenAIKey: false,
  isOpen: false,
  isMinimized: false,
  contextType: undefined,
  contextId: undefined,
  contextData: undefined,
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  // ============================================
  // Conversation Management
  // ============================================

  setConversation: (conversation) => set({ conversation }),

  createConversation: async (context) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ error: 'You must be logged in to start a conversation' });
        return;
      }

      // Check quota before creating conversation
      const quotaCheck = await get().checkQuota();
      if (!quotaCheck.can_query && !quotaCheck.requires_payment) {
        set({ error: quotaCheck.reason });
        return;
      }

      // Calculate expiration based on tier
      const subscription = get().subscription;
      let expires_at: string | undefined;

      if (subscription) {
        if (subscription.tier === 'free') {
          expires_at = undefined; // No persistent storage
        } else if (subscription.tier === 'basic') {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          expires_at = date.toISOString();
        } else if (subscription.tier === 'pro') {
          const date = new Date();
          date.setDate(date.getDate() + 90);
          expires_at = date.toISOString();
        }
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: context?.data?.name || 'New conversation',
          context_type: context?.type,
          context_id: context?.id,
          context_data: context?.data,
          expires_at,
        })
        .select()
        .single();

      if (error) {
        set({ error: `Failed to create conversation: ${error.message}` });
        return;
      }

      set({
        conversation: data,
        messages: [],
        contextType: context?.type,
        contextId: context?.id,
        contextData: context?.data,
      });
    } catch (err) {
      set({ error: `Unexpected error: ${err}` });
    }
  },

  loadConversation: async (id) => {
    try {
      set({ isLoading: true, error: null });

      // Load conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (convError) {
        set({ error: `Failed to load conversation: ${convError.message}`, isLoading: false });
        return;
      }

      // Load messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (msgError) {
        set({ error: `Failed to load messages: ${msgError.message}`, isLoading: false });
        return;
      }

      set({
        conversation,
        messages: messages || [],
        contextType: conversation.context_type,
        contextId: conversation.context_id,
        contextData: conversation.context_data,
        isLoading: false,
      });
    } catch (err) {
      set({ error: `Unexpected error: ${err}`, isLoading: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) {
        set({ error: `Failed to delete conversation: ${error.message}` });
        return;
      }

      // Clear current conversation if it was deleted
      if (get().conversation?.id === id) {
        set({ conversation: null, messages: [] });
      }
    } catch (err) {
      set({ error: `Unexpected error: ${err}` });
    }
  },

  // ============================================
  // Message Management
  // ============================================

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  sendMessage: async (content) => {
    const state = get();

    // Check if we have a conversation
    if (!state.conversation) {
      await get().createConversation();

      // If creation failed, don't continue
      if (!get().conversation) {
        return;
      }
    }

    try {
      set({ isLoading: true, error: null });

      // Add user message to UI immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: state.conversation!.id,
        role: 'user',
        content,
        used_byo_key: false,
        created_at: new Date().toISOString(),
      };

      get().addMessage(userMessage);
      set({ input: '' });

      // Check quota
      const quotaCheck = await get().checkQuota();
      if (!quotaCheck.can_query) {
        set({
          error: quotaCheck.reason,
          isLoading: false,
        });
        return;
      }

      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: state.conversation!.id,
          message: content,
          context: {
            type: state.contextType,
            id: state.contextId,
            data: state.contextData,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: state.conversation!.id,
        role: 'assistant',
        content: '',
        used_byo_key: false,
        created_at: new Date().toISOString(),
      };

      get().addMessage(assistantMessage);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.content) {
                assistantMessage.content += parsed.content;

                // Update message in state
                set((state) => ({
                  messages: state.messages.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...assistantMessage }
                      : msg
                  ),
                }));
              }

              if (parsed.done) {
                assistantMessage = { ...assistantMessage, ...parsed.message };
              }
            } catch (e) {
              console.error('Failed to parse streaming data:', e);
            }
          }
        }
      }

      set({ isLoading: false });

      // Refresh usage stats after successful query
      await get().refreshUsageStats();

    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to send message',
        isLoading: false,
      });
    }
  },

  // ============================================
  // Input State
  // ============================================

  setInput: (input) => set({ input }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // ============================================
  // Quota and Subscription
  // ============================================

  setSubscription: (subscription) => set({ subscription }),

  checkQuota: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          can_query: false,
          reason: 'You must be logged in',
          requires_payment: false,
        };
      }

      const response = await fetch('/api/chat/quota', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to check quota');
      }

      const quotaStatus: QuotaCheckResult = await response.json();
      set({ quotaStatus });

      return quotaStatus;
    } catch (err) {
      console.error('Failed to check quota:', err);
      return {
        can_query: false,
        reason: 'Failed to check quota',
        requires_payment: false,
      };
    }
  },

  refreshUsageStats: async () => {
    try {
      const response = await fetch('/api/chat/usage', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      const usageStats: UsageStats = await response.json();
      set({ usageStats });
    } catch (err) {
      console.error('Failed to fetch usage stats:', err);
    }
  },

  // ============================================
  // API Keys
  // ============================================

  setHasAnthropicKey: (has) => set({ hasAnthropicKey: has }),
  setHasOpenAIKey: (has) => set({ hasOpenAIKey: has }),

  // ============================================
  // UI State
  // ============================================

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),

  // ============================================
  // Context
  // ============================================

  setContext: (type, id, data) => {
    set({
      contextType: type,
      contextId: id,
      contextData: data,
    });
  },

  clearContext: () => {
    set({
      contextType: undefined,
      contextId: undefined,
      contextData: undefined,
    });
  },

  // ============================================
  // Reset
  // ============================================

  reset: () => set(initialState),
}));

// ============================================
// Hooks for common operations
// ============================================

export const useChatOpen = () => {
  const isOpen = useChatStore((state) => state.isOpen);
  const toggleOpen = useChatStore((state) => state.toggleOpen);
  return [isOpen, toggleOpen] as const;
};

export const useChatMessages = () => {
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  return { messages, isLoading };
};

export const useChatInput = () => {
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isLoading = useChatStore((state) => state.isLoading);

  return {
    input,
    setInput,
    sendMessage,
    isLoading,
  };
};

export const useChatQuota = () => {
  const quotaStatus = useChatStore((state) => state.quotaStatus);
  const usageStats = useChatStore((state) => state.usageStats);
  const checkQuota = useChatStore((state) => state.checkQuota);
  const refreshUsageStats = useChatStore((state) => state.refreshUsageStats);

  return {
    quotaStatus,
    usageStats,
    checkQuota,
    refreshUsageStats,
  };
};

export const useChatContext = () => {
  const contextType = useChatStore((state) => state.contextType);
  const contextId = useChatStore((state) => state.contextId);
  const contextData = useChatStore((state) => state.contextData);
  const setContext = useChatStore((state) => state.setContext);
  const clearContext = useChatStore((state) => state.clearContext);

  return {
    contextType,
    contextId,
    contextData,
    setContext,
    clearContext,
  };
};
