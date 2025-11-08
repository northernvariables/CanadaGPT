/**
 * useShare Hook
 *
 * Provides share functionality with Web Share API support and fallbacks
 * for social media platforms, email, clipboard, and print.
 */

import { useState, useCallback, useEffect } from 'react';

export interface ShareData {
  url: string;
  title: string;
  description?: string;
}

export interface ShareMethods {
  shareNative: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
  shareEmail: () => void;
  sharePrint: () => void;
  shareTwitter: () => void;
  shareFacebook: () => void;
  shareLinkedIn: () => void;
  shareReddit: () => void;
  shareEHSocial: () => void;
  shareThreads: () => void;
}

export interface UseShareReturn extends ShareMethods {
  isSupported: boolean;
  isLoading: boolean;
  isCopied: boolean;
  error: string | null;
}

export function useShare(shareData: ShareData): UseShareReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect Web Share API support
  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' &&
      'share' in navigator &&
      navigator.canShare?.({ url: shareData.url, title: shareData.title }) !== false
    );
  }, [shareData.url, shareData.title]);

  // Convert relative URLs to absolute
  const getAbsoluteUrl = useCallback((url: string): string => {
    if (url.startsWith('http')) {
      return url;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url}`;
    }
    return url;
  }, []);

  // Native Web Share API
  const shareNative = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Web Share API not supported');
    }

    setIsLoading(true);
    setError(null);

    try {
      await navigator.share({
        url: getAbsoluteUrl(shareData.url),
        title: shareData.title,
        text: shareData.description,
      });
    } catch (err) {
      // AbortError is thrown when user cancels - ignore it
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, shareData, getAbsoluteUrl]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const absoluteUrl = getAbsoluteUrl(shareData.url);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = absoluteUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [shareData.url, getAbsoluteUrl]);

  // Email share
  const shareEmail = useCallback(() => {
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(
      `${shareData.description || ''}\n\n${getAbsoluteUrl(shareData.url)}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }, [shareData, getAbsoluteUrl]);

  // Print functionality
  const sharePrint = useCallback(() => {
    window.print();
  }, []);

  // Twitter/X share
  const shareTwitter = useCallback(() => {
    const url = getAbsoluteUrl(shareData.url);
    const text = encodeURIComponent(shareData.title);
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`,
      '_blank',
      'width=550,height=420'
    );
  }, [shareData, getAbsoluteUrl]);

  // Facebook share
  const shareFacebook = useCallback(() => {
    const url = getAbsoluteUrl(shareData.url);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    );
  }, [shareData.url, getAbsoluteUrl]);

  // LinkedIn share
  const shareLinkedIn = useCallback(() => {
    const url = getAbsoluteUrl(shareData.url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'width=550,height=420'
    );
  }, [shareData.url, getAbsoluteUrl]);

  // Reddit share
  const shareReddit = useCallback(() => {
    const url = getAbsoluteUrl(shareData.url);
    const title = encodeURIComponent(shareData.title);
    window.open(
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${title}`,
      '_blank',
      'width=550,height=420'
    );
  }, [shareData, getAbsoluteUrl]);

  // EH! Social share
  const shareEHSocial = useCallback(() => {
    const url = getAbsoluteUrl(shareData.url);
    const text = encodeURIComponent(shareData.title);
    window.open(
      `https://eh.social/share?url=${encodeURIComponent(url)}&text=${text}`,
      '_blank',
      'width=550,height=420'
    );
  }, [shareData, getAbsoluteUrl]);

  // Threads share
  const shareThreads = useCallback(() => {
    const url = getAbsoluteUrl(shareData.url);
    const text = encodeURIComponent(`${shareData.title} ${url}`);
    window.open(
      `https://threads.net/intent/post?text=${text}`,
      '_blank',
      'width=550,height=420'
    );
  }, [shareData, getAbsoluteUrl]);

  return {
    isSupported,
    isLoading,
    isCopied,
    error,
    shareNative,
    copyToClipboard,
    shareEmail,
    sharePrint,
    shareTwitter,
    shareFacebook,
    shareLinkedIn,
    shareReddit,
    shareEHSocial,
    shareThreads,
  };
}
