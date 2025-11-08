'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare, Flag, Edit, Trash2, Lock, Pin } from 'lucide-react';
import { VoteButtons } from './VoteButtons';
import type { ForumPost } from '@/types/forum';
import { useAuth } from '@/contexts/AuthContext';
import { ShareButton } from '../ShareButton';
import { PrintableCard } from '../PrintableCard';

interface PostCardProps {
  post: ForumPost;
  showReplyButton?: boolean;
  showCategory?: boolean;
  onReply?: (post: ForumPost) => void;
  onEdit?: (post: ForumPost) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  variant?: 'full' | 'compact';
}

export function PostCard({
  post,
  showReplyButton = true,
  showCategory = false,
  onReply,
  onEdit,
  onDelete,
  onReport,
  variant = 'full',
}: PostCardProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const [isExpanded, setIsExpanded] = useState(variant === 'full');
  const [localUpvotes, setLocalUpvotes] = useState(post.upvotes_count);
  const [localDownvotes, setLocalDownvotes] = useState(post.downvotes_count);

  const isAuthor = user?.id === post.author_id;
  const canEdit = isAuthor && !post.is_deleted && !post.is_locked;
  const canDelete = isAuthor && !post.is_deleted;

  // Format timestamp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleVoteChange = (upvotes: number, downvotes: number) => {
    setLocalUpvotes(upvotes);
    setLocalDownvotes(downvotes);
  };

  // Truncate content for compact view
  const displayContent = variant === 'compact' && !isExpanded && post.content.length > 300
    ? post.content.slice(0, 300) + '...'
    : post.content;

  const needsTruncation = variant === 'compact' && post.content.length > 300;

  // Share data
  const shareUrl = post.bill_number
    ? `/${locale}/bills/${post.bill_number}#post-${post.id}`
    : `/${locale}/forum#post-${post.id}`;
  const shareTitle = post.title || `${post.author?.display_name || 'Anonymous'}'s post`;
  const shareDescription = post.content
    .replace(/[#*_~`>\[\]]/g, '') // Remove basic markdown
    .substring(0, 150) + (post.content.length > 150 ? '...' : '');

  return (
    <PrintableCard>
      <div
      className={`
        bg-background-secondary rounded-lg border-2 border-border-primary
        ${post.is_pinned ? 'border-accent-red' : ''}
        ${post.is_deleted ? 'opacity-60' : ''}
        transition-all hover:border-border-hover
      `}
    >
      <div className="flex gap-4 p-4">
        {/* Voting column */}
        <div className="flex-shrink-0">
          <VoteButtons
            postId={post.id}
            upvotes={localUpvotes}
            downvotes={localDownvotes}
            userVote={post.user_vote}
            size="md"
            onVoteChange={handleVoteChange}
          />
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2 relative">
            {/* Share Button - Top Right */}
            <div className="absolute top-0 right-0">
              <ShareButton
                url={shareUrl}
                title={shareTitle}
                description={shareDescription}
                size="sm"
              />
            </div>

            <div className="flex-1 min-w-0 pr-8">
              {/* Title */}
              {post.title && (
                <h3 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
                  {post.is_pinned && (
                    <Pin size={16} className="text-accent-red flex-shrink-0" />
                  )}
                  {post.is_locked && (
                    <Lock size={16} className="text-yellow-500 flex-shrink-0" />
                  )}
                  <span className="truncate">{post.title}</span>
                </h3>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-2 text-sm text-text-tertiary flex-wrap">
                <span className="font-medium text-text-secondary">
                  {post.author?.display_name || 'Anonymous'}
                </span>
                <span>•</span>
                <time dateTime={post.created_at}>
                  {formatDate(post.created_at)}
                </time>
                {post.edited_at && (
                  <>
                    <span>•</span>
                    <span className="italic">edited</span>
                  </>
                )}
                {showCategory && post.category && (
                  <>
                    <span>•</span>
                    <span className="text-accent-red">
                      {post.category.name}
                    </span>
                  </>
                )}
                {post.bill_number && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-xs bg-background-primary px-2 py-0.5 rounded">
                      Bill {post.bill_number}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {post.is_deleted ? (
            <div className="text-text-tertiary italic py-2">
              [This post has been deleted]
            </div>
          ) : (
            <div className="prose prose-invert max-w-none prose-sm mb-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Expand/Collapse for truncated content */}
          {needsTruncation && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-accent-red text-sm hover:underline mb-3"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}

          {/* Actions bar */}
          {!post.is_deleted && (
            <div className="flex items-center gap-4 text-sm">
              {/* Reply button */}
              {showReplyButton && onReply && !post.is_locked && (
                <button
                  onClick={() => onReply(post)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent-red transition-colors"
                >
                  <MessageSquare size={16} />
                  <span>Reply</span>
                  {post.reply_count > 0 && (
                    <span className="text-text-tertiary">({post.reply_count})</span>
                  )}
                </button>
              )}

              {/* Edit button */}
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(post)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-blue-500 transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              )}

              {/* Delete button */}
              {canDelete && onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this post?')) {
                      onDelete(post.id);
                    }
                  }}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}

              {/* Report button */}
              {!isAuthor && onReport && (
                <button
                  onClick={() => onReport(post.id)}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-yellow-500 transition-colors ml-auto"
                >
                  <Flag size={16} />
                  <span>Report</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </PrintableCard>
  );
}
