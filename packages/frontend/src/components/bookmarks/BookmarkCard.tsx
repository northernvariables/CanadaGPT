/**
 * BookmarkCard Component
 *
 * Individual bookmark item display in the drawer
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Trash2, ExternalLink, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { Bookmark } from '@/hooks/useBookmarks';
import { cn } from '@canadagpt/design-system';
import { MarkdownRenderer, getMarkdownPreview } from './MarkdownRenderer';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onToggleFavorite?: (bookmarkId: string) => void;
  onDelete?: (bookmarkId: string) => void;
  onEditNote?: (bookmarkId: string) => void;
  tier?: string | null;
}

// Type badge colors
const TYPE_COLORS: Record<string, string> = {
  mp: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  statement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  bill: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  post: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  committee: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  debate: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

// Type labels
const TYPE_LABELS: Record<string, string> = {
  mp: 'MP',
  statement: 'Statement',
  bill: 'Bill',
  post: 'Post',
  committee: 'Committee',
  debate: 'Debate',
};

export function BookmarkCard({ bookmark, onToggleFavorite, onDelete, onEditNote, tier }: BookmarkCardProps) {
  const [noteExpanded, setNoteExpanded] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(bookmark.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this bookmark?')) {
      onDelete?.(bookmark.id);
    }
  };

  const handleEditNoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditNote?.(bookmark.id);
  };

  const toggleNoteExpansion = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteExpanded(!noteExpanded);
  };

  const hasNote = bookmark.notes && bookmark.notes.trim() !== '';
  const hasAIPrompt = bookmark.ai_prompt && bookmark.ai_prompt.trim() !== '';

  return (
    <Link href={bookmark.url}>
      <div className="group p-3 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent-red hover:shadow-md transition-all cursor-pointer">
        <div className="flex gap-3">
          {/* Thumbnail */}
          {bookmark.image_url && (
            <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-bg-overlay">
              <img
                src={bookmark.image_url}
                alt={bookmark.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Type Badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-accent-red transition-colors">
                {bookmark.title}
              </h4>
              <span
                className={cn(
                  'flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full',
                  TYPE_COLORS[bookmark.item_type] || 'bg-gray-100 text-gray-700'
                )}
              >
                {TYPE_LABELS[bookmark.item_type] || bookmark.item_type}
              </span>
            </div>

            {/* Subtitle */}
            {bookmark.subtitle && (
              <p className="text-xs text-text-secondary line-clamp-1 mb-2">
                {bookmark.subtitle}
              </p>
            )}

            {/* Tags */}
            {bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {bookmark.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-bg-overlay text-text-tertiary"
                  >
                    {tag}
                  </span>
                ))}
                {bookmark.tags.length > 3 && (
                  <span className="px-1.5 py-0.5 text-[10px] text-text-tertiary">
                    +{bookmark.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Enhanced Notes Section */}
            {hasNote && (
              <div className="mt-2 p-2 bg-bg-overlay rounded border-l-2 border-accent-red/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-secondary">Note</span>
                    {hasAIPrompt && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleEditNoteClick}
                      className="p-1 rounded hover:bg-bg-elevated transition-colors text-text-tertiary hover:text-accent-red"
                      title="Edit note"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={toggleNoteExpansion}
                      className="p-1 rounded hover:bg-bg-elevated transition-colors text-text-tertiary"
                      title={noteExpanded ? 'Collapse' : 'Expand'}
                    >
                      {noteExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                {noteExpanded ? (
                  <div className="text-xs text-text-secondary prose-sm">
                    <MarkdownRenderer content={bookmark.notes || ''} />
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary italic line-clamp-2">
                    {getMarkdownPreview(bookmark.notes || '', 120)}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              {/* Edit Note / Add Note Button */}
              <button
                onClick={handleEditNoteClick}
                className={cn(
                  'p-1 rounded hover:bg-bg-overlay transition-colors',
                  hasNote ? 'text-text-tertiary hover:text-accent-red' : 'text-text-tertiary hover:text-blue-600'
                )}
                title={hasNote ? 'Edit note' : 'Add note'}
              >
                <Edit3 size={14} />
              </button>

              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className={cn(
                  'p-1 rounded hover:bg-bg-overlay transition-colors',
                  bookmark.is_favorite ? 'text-amber-500' : 'text-text-tertiary hover:text-amber-500'
                )}
                title={bookmark.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  size={14}
                  className={bookmark.is_favorite ? 'fill-current' : ''}
                />
              </button>

              {/* Delete Button */}
              <button
                onClick={handleDeleteClick}
                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-tertiary hover:text-red-600 transition-colors"
                title="Delete bookmark"
              >
                <Trash2 size={14} />
              </button>

              {/* Date */}
              <span className="ml-auto text-[10px] text-text-tertiary">
                {new Date(bookmark.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
