'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface Comment {
  id: number;
  content: string;
  authorName: string;
  likeCount: number;
  createdAt: string;
  replies?: Comment[];
}

// Simple session user interface - only includes fields needed for comment operations
interface SessionUser {
  id: number;
  username: string;
  nickname: string;
  role: number;
  profileImage?: string | null;
}

interface CommentListProps {
  comments: Comment[];
  postId: number;
  sessionUser: SessionUser | null;
  canEdit: boolean;
  canDelete: boolean;
}

interface CommentItemProps {
  comment: Comment;
  postId: number;
  sessionUser: SessionUser | null;
  canEdit: boolean;
  canDelete: boolean;
  level?: number;
}

export function CommentItem({
  comment,
  postId,
  sessionUser,
  canEdit,
  canDelete,
  level = 0,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);

  const handleLike = async () => {
    if (!sessionUser) {
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
        toast.success('댓글이 등록되었습니다.');
        setReplyText('');
        setIsReplying(false);
        // Reload page to show new comment
        window.location.reload();
      } else {
        toast.error(data.error || '댓글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('댓글 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('삭제 권한이 없습니다.');
      return;
    }

    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

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
    }
  };

  return (
    <div
      className={`border-b pb-4 last:border-0 ${level > 0 ? 'ml-12' : ''}`}
      style={{ marginLeft: level * 48 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500">👤</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {comment.authorName || '작성자'}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap">{comment.content}</div>
          <div className="mt-2 flex gap-2 text-sm">
            <button
              onClick={handleLike}
              className={`${
                liked ? 'text-red-600' : 'text-gray-500'
              } hover:text-red-900 transition-colors`}
              disabled={!sessionUser}
            >
              👍 {likeCount}
            </button>
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              답글
            </button>
            {(canEdit || canDelete) && (
              <>
                {canEdit && (
                  <button className="text-gray-500 hover:text-blue-600 transition-colors">
                    수정
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && sessionUser && (
            <form onSubmit={handleReplySubmit} className="mt-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !replyText.trim()}
                >
                  {isSubmitting ? '등록 중...' : '답글 등록'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested comments */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              sessionUser={sessionUser}
              canEdit={canEdit}
              canDelete={canDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentList({
  comments,
  postId,
  sessionUser,
  canEdit,
  canDelete,
}: CommentListProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    if (!sessionUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: newComment,
          parentId: null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('댓글이 등록되었습니다.');
        setNewComment('');
        // Reload page to show new comment
        window.location.reload();
      } else {
        toast.error(data.error || '댓글 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('댓글 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        댓글 ({comments.length})
      </h2>

      {/* Comment Form */}
      {sessionUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSubmitting}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? '등록 중...' : '댓글 작성'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 text-center py-4 bg-gray-50 rounded-md">
          <p className="text-gray-600 mb-2">로그인 후 댓글을 작성할 수 있습니다.</p>
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            로그인
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            sessionUser={sessionUser}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">댓글이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
