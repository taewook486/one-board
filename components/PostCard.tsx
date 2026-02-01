import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';

export interface Post {
  id: number;
  title: string;
  content: string;
  authorName: string | null;
  nickname?: string | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isNotice: boolean;
  isPinned: boolean;
  isSecret: boolean;
  isEvent: boolean;
  category: string | null;
}

export interface PostCardProps {
  post: Post;
  boardKey: string;
  showNumber?: boolean;
  number?: number;
  showThumbnail?: boolean;
  showCategory?: boolean;
  className?: string;
}

export default function PostCard({
  post,
  boardKey,
  showNumber = true,
  number,
  showThumbnail = false,
  showCategory = false,
  className = '',
}: PostCardProps) {
  return (
    <div className={`group ${className}`}>
      <div className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
        <div className="flex gap-4">
          {/* Thumbnail (optional) */}
          {showThumbnail && (
            <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
              {/* Could extract first image from content */}
              <div className="w-full h-full flex items-center justify-center text-3xl">
                📄
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Post Number & Badges */}
            <div className="flex items-center gap-2 mb-2">
              {showNumber && number !== undefined && (
                <span className="text-sm font-medium text-gray-500">
                  {number}
                </span>
              )}
              {post.isNotice && (
                <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded">
                  공지
                </span>
              )}
              {post.isPinned && !post.isNotice && (
                <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-500 rounded">
                  고정
                </span>
              )}
              {post.isEvent && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-indigo-500 text-white">
                  <span className="material-symbols-filled text-[14px]">campaign</span>
                  이벤트
                </span>
              )}
              {post.isSecret && (
                <span className="text-sm">🔒</span>
              )}
              {showCategory && post.category && (
                <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                  {post.category}
                </span>
              )}
            </div>

            {/* Title */}
            <Link
              href={`/board/${boardKey}/${post.id}`}
              className="block group-hover:text-blue-600"
            >
              <h3 className="text-base font-medium text-gray-900 truncate group-hover:underline">
                {post.title}
              </h3>
            </Link>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="font-medium text-gray-900">
                {post.authorName || post.nickname || '익명'}
              </span>
              <span>{formatRelativeTime(new Date(post.createdAt))}</span>
              <span>조회 {post.viewCount}</span>
              <span>추천 {post.likeCount}</span>
              {post.commentCount > 0 && (
                <span>댓글 {post.commentCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
