import Link from 'next/link';
import PostCard from './PostCard';
import type { Post } from './PostCard';

interface PostListProps {
  posts: Post[];
  boardKey: string;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  showNumbers?: boolean;
  showThumbnails?: boolean;
  showCategories?: boolean;
  className?: string;
}

export default function PostList({
  posts,
  boardKey,
  currentPage = 1,
  pageSize = 20,
  total,
  onPageChange,
  showNumbers = true,
  showThumbnails = false,
  showCategories = false,
  className = '',
}: PostListProps) {
  const totalPages = total ? Math.ceil(total / pageSize) : Math.ceil(posts.length / pageSize);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Post Cards */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              boardKey={boardKey}
              number={showNumbers ? (currentPage - 1) * pageSize + posts.length - index : undefined}
              showNumber={showNumbers}
              showThumbnail={showThumbnails}
              showCategory={showCategories}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-700">
            총 {total || posts.length}개의 게시글
            {total && (
              <span className="ml-2 text-gray-500">
                (페이지 {currentPage} / {totalPages})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* First Page */}
            {currentPage > 2 && onPageChange && (
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-100"
              >
                처음
              </button>
            )}

            {/* Previous Page */}
            {currentPage > 1 && onPageChange && (
              <button
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-100"
              >
                이전
              </button>
            )}

            {/* Page Numbers */}
            <div className="flex gap-1">
              {(() => {
                // Show limited page numbers
                const pagesToShow = [];
                const maxPagesToShow = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                if (endPage - startPage < maxPagesToShow - 1) {
                  startPage = Math.max(1, endPage - maxPagesToShow + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pagesToShow.push(i);
                }

                return pagesToShow.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>

            {/* Next Page */}
            {currentPage < totalPages && onPageChange && (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-100"
              >
                다음
              </button>
            )}

            {/* Last Page */}
            {currentPage < totalPages - 1 && onPageChange && (
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-100"
              >
                끝
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { PostListProps, Post };
