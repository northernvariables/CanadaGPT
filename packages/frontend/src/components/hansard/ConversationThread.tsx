/**
 * ConversationThread Component
 * Container for managing and displaying conversation threads
 */

'use client';

import React, { useMemo } from 'react';
import { ThreadedSpeechCard } from './ThreadedSpeechCard';

interface Statement {
  id: string;
  time?: string;
  who_en?: string;
  who_fr?: string;
  content_en?: string;
  content_fr?: string;
  h1_en?: string;
  h1_fr?: string;
  h2_en?: string;
  h2_fr?: string;
  statement_type?: string;
  wordcount?: number;
  thread_id?: string;
  parent_statement_id?: string;
  sequence_in_thread?: number;
  madeBy?: {
    id: string;
    name: string;
    party: string;
    photo_url?: string;
  };
  replies?: Statement[];
}

interface ConversationThreadProps {
  statements: Statement[];
  defaultExpanded?: boolean;
  onStatementClick?: (statement: Statement) => void;
  className?: string;
}

interface Thread {
  id: string;
  root: Statement;
  replies: Statement[];
}

/**
 * Groups statements into conversation threads
 */
function groupStatementsIntoThreads(statements: Statement[]): Thread[] {
  // If statements already have replies populated from GraphQL
  const rootStatements = statements.filter(
    (s) => !s.parent_statement_id || s.sequence_in_thread === 0
  );

  // Create thread objects
  const threads: Thread[] = rootStatements.map((root) => {
    // Find replies for this root
    const replies = statements
      .filter((s) => s.parent_statement_id === root.id && s.id !== root.id)
      .sort((a, b) => (a.sequence_in_thread || 0) - (b.sequence_in_thread || 0));

    return {
      id: root.thread_id || root.id,
      root,
      replies,
    };
  });

  return threads;
}

/**
 * Client-side threading fallback
 * Used when thread_id/parent_statement_id are not available from backend
 */
function inferThreadsFromStatements(statements: Statement[]): Thread[] {
  const threads: Thread[] = [];
  let currentThread: Thread | null = null;

  // Sort by time
  const sorted = [...statements].sort((a, b) => {
    if (!a.time || !b.time) return 0;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  sorted.forEach((stmt) => {
    const isQuestion = stmt.statement_type?.toLowerCase() === 'question';
    const isReply = ['answer', 'interjection'].includes(stmt.statement_type?.toLowerCase() || '');

    if (isQuestion || !currentThread) {
      // Start new thread
      if (currentThread) {
        threads.push(currentThread);
      }
      currentThread = {
        id: stmt.id,
        root: stmt,
        replies: [],
      };
    } else if (isReply && currentThread) {
      // Add to current thread if within time threshold (5 min)
      const timeDiff =
        currentThread.root.time && stmt.time
          ? new Date(stmt.time).getTime() - new Date(currentThread.root.time).getTime()
          : 0;

      if (timeDiff <= 300000) {
        // 5 minutes
        currentThread.replies.push(stmt);
      } else {
        // Start new thread
        threads.push(currentThread);
        currentThread = {
          id: stmt.id,
          root: stmt,
          replies: [],
        };
      }
    } else {
      // Not a question or reply, create standalone thread
      if (currentThread) {
        threads.push(currentThread);
      }
      currentThread = {
        id: stmt.id,
        root: stmt,
        replies: [],
      };
    }
  });

  // Add last thread
  if (currentThread) {
    threads.push(currentThread);
  }

  return threads;
}

/**
 * Main conversation thread container
 */
export const ConversationThread = React.memo(function ConversationThread({
  statements,
  defaultExpanded = false,
  onStatementClick,
  className = '',
}: ConversationThreadProps) {
  // Group statements into threads
  const threads = useMemo(() => {
    if (!statements || statements.length === 0) {
      return [];
    }

    // Check if statements have thread_id (from backend)
    const hasThreading = statements.some((s) => s.thread_id || s.parent_statement_id);

    if (hasThreading) {
      return groupStatementsIntoThreads(statements);
    } else {
      // Fallback to client-side inference
      return inferThreadsFromStatements(statements);
    }
  }, [statements]);

  if (threads.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {threads.map((thread) => (
        <ThreadedSpeechCard
          key={thread.id}
          rootStatement={thread.root}
          replies={thread.replies}
          defaultExpanded={defaultExpanded}
          onStatementClick={onStatementClick}
        />
      ))}
    </div>
  );
});

/**
 * Hook to determine if statements should be threaded
 */
export function useThreadedStatements(statements: Statement[]) {
  const hasThreading = useMemo(
    () => statements.some((s) => s.thread_id || s.parent_statement_id),
    [statements]
  );

  return {
    hasThreading,
    canThread: statements.length > 0,
  };
}
