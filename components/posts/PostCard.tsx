'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface Post {
  id: number;
  title: string;
  content: string;
  authorName: string | null;
  nickname: string | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isNotice: boolean;
  isPinned: boolean;
  isSecret: boolean;
  category: string | null;
  boardKey: string;
  boardName?: string;
  categoryName?: string;
  thumbnail?: string | null;
}

export interface PostCardProps {
  post: Post;
  layout?: 'card' | 'list';
  showThumbnail?: boolean;
  showCategory?: boolean;
  showNumber?: boolean;
  number?: number;
}

export default function PostCard({ post, layout = 'card', showThumbnail = true, showCategory = true, showNumber = false, number }: PostCardProps) {
  const truncateContent = (html: string, maxLength = 100) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const extractImage = (html: string) => {
    const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
    return imgMatch ? imgMatch[1] : null;
  };

  const thumbnail = extractImage(post.content);

  return (
    <Link
      href={`/board/${post.boardKey}/${post.id}`}
      className={`group block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 ${
        layout === 'card' ? 'p-5' : 'flex items-center gap-4 p-3'
      }`}
    >
      {showNumber && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
          {number}
        </div>
      )}

      {showThumbnail && thumbnail && layout === 'card' && (
        <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg mr-4 relative">
          <Image
            src={thumbnail || '/placeholder.svg'}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 128px) 100vw, 128px"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {showCategory && post.categoryName && (
          <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-1">
            {post.categoryName}
          </span>
        )}

        <h3 className={`font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1 ${
          layout === 'card' ? 'text-lg' : 'text-base'
        }`}>
          {post.title}
        </h3>

        <p className={`text-sm text-gray-600 line-clamp-2 mb-2 ${layout === 'card' ? '' : 'mb-0'}`}>
          {truncateContent(post.content)}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{post.authorName || post.nickname || '익명'}</span>
          <span>•</span>
          <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a2 2 0 00-2 2v11.318C3.318 11.636 0 11.636 2h-1v11.318c0-1.244 1.414-2.414 2.414-2.414V12.872l-8.059-8.059a2 2 0 00-2.828-2.828 2.828-2.414 2.414 2.414V12.872a2 2 0 01-2.828 2.828 2.414 2.414V12.872c-1.244 1.414-2.414 2.414 2.414L16 3.636C16 17.244 15.586 13.586 14.142 13.586 13.586 13.586V4.714h-1.5z" />
            </svg>
            <span>{post.likeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a4 4 0 01-4 4-9 4 4-9 4 4 4.9 0 018 9a4 4 0 00-18 9h-4v4a4 4 0 01-4 4 4-9 4 4 0 002 2h2a4 4 0 00-2 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2z" />
            </svg>
            <span>{post.commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
