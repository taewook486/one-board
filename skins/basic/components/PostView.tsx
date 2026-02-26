import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';
import type { BoardPost, PostComment } from '@/lib/db';

interface PostViewProps {
  post: BoardPost;
  comments: PostComment[];
  boardKey: string;
  canEdit?: boolean;
}

interface CommentWithReplies extends PostComment {
  replies?: CommentWithReplies[];
}

export default function PostView({ post, comments, boardKey, canEdit }: PostViewProps) {
  return (
    <div className="space-y-6">
      {/* Post Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {post.isNotice && (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded mr-2">
                  공지
                </span>
              )}
              {post.isPinned && (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded mr-2">
                  고정
                </span>
              )}
              {post.isSecret && <span className="mr-2">🔒</span>}
              {post.title}
            </h1>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/write?postId=${post.id}&board=${boardKey}`}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
              >
                수정
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-b py-3">
          <span className="font-medium text-gray-900">
            {post.authorName || '작성자'}
          </span>
          <span>{formatRelativeTime(post.createdAt)}</span>
          <span>조회 {post.viewCount}</span>
          <span>추천 {post.likeCount}</span>
          {post.category && <span className="px-2 py-1 bg-gray-100 rounded">{post.category}</span>}
        </div>

        <div className="py-4">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {post.tags && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {post.tags.split(',').map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          댓글 ({comments.length})
        </h2>
        <div className="space-y-4">
          {comments.map((comment: CommentWithReplies) => (
            <Comment key={comment.id} comment={comment} boardKey={boardKey} />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-500 py-8">댓글이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Comment({ comment, boardKey }: { comment: CommentWithReplies; boardKey: string }) {
  return (
    <div className="border-b pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-gray-500">👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-gray-900 truncate">
              {comment.authorName || '익명'}
            </span>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <div className="text-gray-700 break-words">{comment.content}</div>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-gray-500">👍 {comment.likeCount}</span>
            <button className="text-gray-500 hover:text-blue-600">답글</button>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 mt-4 space-y-4">
          {comment.replies.map((reply: CommentWithReplies) => (
            <Comment key={reply.id} comment={reply} boardKey={boardKey} />
          ))}
        </div>
      )}
    </div>
  );
}
