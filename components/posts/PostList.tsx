'use client';

import PostCard from './PostCard';
import type { Post } from './PostCard';

export interface PostListProps {
  posts: Post[];
  boardKey: string;
  view?: 'card' | 'list';
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  showNumbers?: boolean;
  showThumbnails?: boolean;
  showCategories?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PostList({
  posts,
  boardKey,
  view = 'list',
  currentPage = 1,
  pageSize = 20,
  total,
  onPageChange,
  showNumbers = true,
  showThumbnails = false,
  showCategories = false,
  isLoading = false,
  emptyMessage = '게시글이 없습니다.',
  children,
  className = '',
}: PostListProps) {
  const totalPages = total ? Math.ceil(total / pageSize) : Math.ceil(posts.length / pageSize);

  if (isLoading) {
    return (
      <div className={className}>
        {view === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(pageSize)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"
              >
                {showThumbnails && (
                  <div className="aspect-[16/9] bg-slate-200"></div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex gap-3">
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-3 w-8 bg-slate-200 rounded"></div>
                      <div className="h-3 w-8 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[...Array(pageSize)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 animate-pulse"
              >
                {showNumbers && <div className="w-12 h-4 bg-slate-200 rounded"></div>}
                {showThumbnails && <div className="w-16 h-16 bg-slate-200 rounded-lg"></div>}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
                <div className="flex gap-5">
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Post Cards */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-20 h-20 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-slate-500 font-medium mb-1">{emptyMessage}</p>
          <p className="text-sm text-slate-400">새로운 게시글을 작성해 보세요!</p>
        </div>
      ) : (
        <>
          {view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={{ ...post, boardKey }}
                  layout="card"
                  number={showNumbers ? (currentPage - 1) * pageSize + posts.length - index : undefined}
                  showNumber={false}
                  showThumbnail={showThumbnails}
                  showCategory={showCategories}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={{ ...post, boardKey }}
                  layout="list"
                  number={showNumbers ? (currentPage - 1) * pageSize + posts.length - index : undefined}
                  showNumber={showNumbers}
                  showThumbnail={showThumbnails}
                  showCategory={showCategories}
                />
              ))}
            </div>
          )}

          {/* Children (custom content) */}
          {children}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
          {/* Info */}
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">
              {total || posts.length}
            </span>
            {' '}개의 게시글
            {total && (
              <>
                {' '}•{' '}
                <span className="text-slate-500">
                  페이지 {currentPage} / {totalPages}
                </span>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {onPageChange && (
            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-colors"
                aria-label="첫 페이지"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous Page */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-colors"
                aria-label="이전 페이지"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {(() => {
                  const maxPagesToShow = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                  if (endPage - startPage < maxPagesToShow - 1) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }

                  const pagesToShow = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pagesToShow.push(i);
                  }

                  return pagesToShow.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-lg transition-all ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                          : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                      aria-label={`페이지 ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}
              </div>

              {/* Mobile Page Info */}
              <div className="sm:hidden px-3 py-2 text-sm font-medium text-slate-600">
                {currentPage} / {totalPages}
              </div>

              {/* Next Page */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-colors"
                aria-label="다음 페이지"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last Page */}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-colors"
                aria-label="마지막 페이지"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { Post };
