'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { TagCloud } from 'react-tagcloud';
import { useLocale } from 'next-intl';

interface Keyword {
  word: string;
  weight: number;
}

interface DebateWordCloudProps {
  keywords_en?: string;
  keywords_fr?: string;
  compact?: boolean;
  className?: string;
}

export function DebateWordCloud({
  keywords_en,
  keywords_fr,
  compact = false,
  className = ''
}: DebateWordCloudProps) {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const keywordsJson = locale === 'fr' ? keywords_fr : keywords_en;

  const tags = useMemo(() => {
    if (!keywordsJson) return [];

    try {
      const keywords: Keyword[] = JSON.parse(keywordsJson);
      if (!Array.isArray(keywords) || keywords.length === 0) return [];

      return keywords.map(k => ({
        value: k.word,
        count: Math.round(k.weight * 100)
      })).filter(t => t.value && t.count > 0);
    } catch (error) {
      console.error('Error parsing keywords:', error);
      return [];
    }
  }, [keywordsJson]);

  // Don't render until client-side mounted
  if (!mounted || tags.length === 0) return null;

  const customRenderer = (tag: any, size: number) => (
    <span
      key={tag.value}
      style={{
        fontSize: `${size}px`,
        margin: '2px 6px',
        padding: '2px 4px',
        display: 'inline-block',
        color: '#DC2626',
        cursor: 'default',
        lineHeight: '1.1',
      }}
      title={`${tag.value} (${tag.count})`}
    >
      {tag.value}
    </span>
  );

  return (
    <div className={`w-full ${compact ? 'h-48' : 'h-64'} ${className}`}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem',
        overflow: 'visible'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '0.25rem'
        }}>
          <TagCloud
            tags={tags}
            minSize={compact ? 12 : 16}
            maxSize={compact ? 36 : 64}
            renderer={customRenderer}
          />
        </div>
      </div>
    </div>
  );
}
