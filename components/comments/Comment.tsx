'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils/common';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  nickname?: string;
  profileImage?: string;
  role?: number;
}

interface Comment {
  id: number;
  content: string;
  authorName: string | null;
  authorImage?: string | null;
  likeCount: number;
  createdAt: string;
  memberId: number | null;
  replies?: Comment[];
}

interface CommentProps {
  comment: Comment;
  postId: number;
  currentUserId: number | null;
  currentUser?: User | null;
  level?: number;
  maxDepth?: number;
}

/**
 * Comment Component - Reusable nested comment system
 *
 * Features:
 * - Nested comment rendering with visual depth indicators
 * - Like button with animation
 * - Reply form with smooth toggle
 * - Edit/Delete with permission checks
 * - Avatar display with initials fallback
 * - Relative time display
 * - Max depth protection (default 5 levels)
 */
export function Comment({
  comment,
  postId,
  currentUserId,
  currentUser,
  level = 0,
  maxDepth = 5,
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isDeleting, setIsDeleting] = useState(false);

  // Permission checks
  const isAuthor = comment.memberId === currentUserId;
  const canEdit = isAuthor && currentUserId !== null;
  const canDelete = isAuthor && currentUserId !== null;
  const canReply = currentUser !== null && level < maxDepth;

  // Generate avatar initials
  const getAvatarInitials = (name: string | null) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get gradient colors based on author name for avatar
  const getAvatarGradient = (name: string | null) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
    ];
    const index = name ? name.length % colors.length : 0;
    return colors[index];
  };

  // Handle like toggle
  const handleLike = async () => {
    if (!currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      } else {
        toast.error(data.error || '좋아요에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('좋아요에 실패했습니다.');
    }
  };

  // Handle reply submit
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: replyText,
          parentId: comment.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('답글이 등록되었습니다.');
        setReplyText('');
        setIsReplying(false);
        // Reload to show new comment
        window.location.reload();
      } else {
        toast.error(data.error || '답글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('답글 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editText,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('댓글이 수정되었습니다.');
        setIsEditing(false);
        window.location.reload();
      } else {
        toast.error(data.error || '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('댓글 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('삭제 권한이 없습니다.');
      return;
    }

    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('댓글이 삭제되었습니다.');
        window.location.reload();
      } else {
        toast.error(data.error || '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('댓글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      {/* Depth guide line for nested comments */}
      {level > 0 && (
        <div
          className="absolute left-0 top-8 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-transparent"
          style={{
            left: `${level * 32}px`,
          }}
        />
      )}

      {/* Comment content */}
      <div
        className="relative pl-4 transition-all duration-300 ease-out"
        style={{
          paddingLeft: `${level * 32 + 16}px`,
        }}
      >
        {/* Avatar */}
        <div className="absolute left-0 top-0 flex-shrink-0" style={{ left: `${level * 32}px` }}>
          <div
            className={`
              w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(comment.authorName)}
              flex items-center justify-center text-white font-semibold text-sm
              shadow-md ring-2 ring-white overflow-hidden relative
            `}
          >
            {comment.authorImage ? (
              <Image
                src={comment.authorImage}
                alt={comment.authorName || 'User'}
                fill
                className="rounded-full object-cover"
                sizes="40px"
              />
            ) : (
              <span>{getAvatarInitials(comment.authorName)}</span>
            )}
          </div>
        </div>

        {/* Comment body */}
        <div className="flex-1 min-w-0">
          {/* Author info and meta */}
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-gray-900 text-sm tracking-tight">
              {comment.authorName || '익명'}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {/* Comment content or edit form */}
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mb-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="댓글을 수정하세요..."
                className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                         transition-all duration-200 resize-none"
                rows={3}
                disabled={isSubmitting}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                           rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r
                           from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700
                           transition-all duration-200 shadow-md shadow-blue-500/20
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !editText.trim()}
                >
                  {isSubmitting ? '저장 중...' : '수정'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-3">
              {comment.content}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Like button */}
            <button
              onClick={handleLike}
              className={`
                group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 ${
                  liked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }
              `}
              disabled={!currentUser}
            >
              <svg
                className={`
                  w-4 h-4 transition-transform duration-200 ${liked ? 'scale-110' : 'scale-100'}
                  ${liked ? 'fill-red-500' : ''}
                `}
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{likeCount}</span>
            </button>

            {/* Reply button */}
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500
                         bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                답글
              </button>
            )}

            {/* Edit button */}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500
                         bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                수정
              </button>
            )}

            {/* Delete button */}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-500
                         bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            )}
          </div>

          {/* Reply form */}
          {isReplying && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
              <form onSubmit={handleReplySubmit}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl
                           focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                           transition-all duration-200 resize-none"
                  rows={3}
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsReplying(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                             rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r
                             from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600
                             hover:to-emerald-700 transition-all duration-200 shadow-md
                             shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !replyText.trim()}
                  >
                    {isSubmitting ? '등록 중...' : '답글 등록'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              currentUser={currentUser}
              level={level + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Comment;
