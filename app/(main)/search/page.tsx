'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/common';
import toast from 'react-hot-toast';
import { useSkin } from '@/components/SkinProvider';

export const dynamic = 'force-dynamic';

interface Board {
  id: number;
  name: string;
  boardKey: string;
  description?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorName: string | null;
  memberId: number | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isNotice: boolean;
  isPinned: boolean;
  isSecret: boolean;
  boardId: number;
  category: string | null;
}

const RESULTS_PER_PAGE = 20;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { darkMode } = useSkin();

  // URL params
  const urlQuery = searchParams.get('q') || '';
  const urlBoard = searchParams.get('board') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlStartDate = searchParams.get('startDate') || '';
  const urlEndDate = searchParams.get('endDate') || '';
  const urlPage = parseInt(searchParams.get('page') || '1');

  // State
  const [query, setQuery] = useState(urlQuery);
  const [selectedBoard, setSelectedBoard] = useState<number | ''>(urlBoard ? parseInt(urlBoard) : '');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [startDate, setStartDate] = useState(urlStartDate);
  const [endDate, setEndDate] = useState(urlEndDate);
  const [currentPage, setCurrentPage] = useState(urlPage);

  const [posts, setPosts] = useState<Post[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      setBoardsLoading(true);
      try {
        const response = await fetch('/api/boards');
        const data = await response.json();
        if (data.success) {
          setBoards(data.boards);
        }
      } catch (error) {
        console.error('Failed to fetch boards:', error);
      } finally {
        setBoardsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  // Update URL params helper
  const updateURL = useCallback((params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/search?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Perform search
  const handleSearch = async (page: number = 1) => {
    if (!query.trim() && !selectedBoard && !selectedCategory && !startDate && !endDate) {
      toast.error('검색어 또는 필터를 선택해주세요.');
      return;
    }

    setLoading(true);
    setSearched(true);
    setCurrentPage(page);

    try {
      const params = new URLSearchParams({
        limit: RESULTS_PER_PAGE.toString(),
        offset: ((page - 1) * RESULTS_PER_PAGE).toString(),
      });

      if (query.trim()) {
        params.append('query', query);
      }

      if (selectedBoard) {
        params.append('boardId', selectedBoard.toString());
      }

      const response = await fetch(`/api/posts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        let filteredPosts = data.posts;

        // Client-side filtering for category
        if (selectedCategory) {
          filteredPosts = filteredPosts.filter((post: Post) =>
            post.category === selectedCategory
          );
        }

        // Client-side filtering for date range
        if (startDate) {
          filteredPosts = filteredPosts.filter((post: Post) =>
            new Date(post.createdAt) >= new Date(startDate)
          );
        }

        if (endDate) {
          filteredPosts = filteredPosts.filter((post: Post) => {
            const postDate = new Date(post.createdAt);
            postDate.setHours(23, 59, 59, 999);
            return postDate <= new Date(endDate);
          });
        }

        setPosts(filteredPosts);
        setTotalCount(filteredPosts.length);

        // Update URL
        updateURL({
          q: query,
          board: selectedBoard,
          category: selectedCategory,
          startDate,
          endDate,
          page,
        });
      } else {
        toast.error('검색에 실패했습니다.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Get available categories from current search results
  const getAvailableCategories = useCallback(() => {
    const categories = new Set<string>();
    posts.forEach((post) => {
      if (post.category) {
        categories.add(post.category);
      }
    });
    return Array.from(categories).sort();
  }, [posts]);

  // Clear all filters
  const handleClear = () => {
    setQuery('');
    setSelectedBoard('');
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setPosts([]);
    setSearched(false);
    router.push('/search');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                게시글 검색
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                제목과 내용에서 원하시는 게시글을 검색하세요
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
          <div className="space-y-5">
            {/* Search Query Input */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                검색어
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="검색어를 입력하세요"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Board Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  게시판
                </label>
                <select
                  value={selectedBoard}
                  onChange={(e) =>
                    setSelectedBoard(
                      e.target.value ? parseInt(e.target.value) : ''
                    )
                  }
                  disabled={boardsLoading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">전체 게시판</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  카테고리
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!searched}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">전체 카테고리</option>
                  {getAvailableCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  시작일
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  종료일
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex gap-3">
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium shadow-md hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    검색 중...
                  </span>
                ) : (
                  '검색'
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={loading || !searched}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searched && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 delay-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Results Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    검색 결과
                  </h2>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                    {totalCount}건
                  </span>
                </div>
                {query && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    &ldquo;{query}&rdquo; 검색 결과
                  </p>
                )}
              </div>

              {/* Results Content */}
              {loading ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">
                      검색 중입니다...
                    </p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    다른 검색어나 필터를 사용해보세요
                  </p>
                  <button
                    onClick={handleClear}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    초기화하기
                  </button>
                </div>
              ) : (
                <>
                  {/* Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            게시판
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            제목
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                            작성자
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                            작성일
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                            조회
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                            추천
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                            댓글
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {posts.map((post, index) => {
                          const board = boards.find((b) => b.id === post.boardId);
                          return (
                            <tr
                              key={post.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 group"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                  {board?.name || '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <Link
                                  href={`/board/${board?.boardKey}/${post.id}`}
                                  className="text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
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
                                    {post.isSecret && (
                                      <span className="text-lg opacity-70">🔒</span>
                                    )}
                                    {post.category && (
                                      <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                                        [{post.category}]
                                      </span>
                                    )}
                                    <span className="truncate">
                                      {post.title}
                                    </span>
                                  </div>
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {post.authorName || '익명'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatRelativeTime(new Date(post.createdAt))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                                {post.viewCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                                {post.likeCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                                {post.commentCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          총 {totalCount}개의 게시글
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            (페이지 {currentPage} / {totalPages})
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* First Page */}
                          {currentPage > 2 && (
                            <button
                              onClick={() => handleSearch(1)}
                              className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition-colors duration-150"
                            >
                              처음
                            </button>
                          )}

                          {/* Previous Page */}
                          {currentPage > 1 && (
                            <button
                              onClick={() => handleSearch(currentPage - 1)}
                              className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition-colors duration-150"
                            >
                              이전
                            </button>
                          )}

                          {/* Page Numbers */}
                          <div className="flex gap-1">
                            {getPageNumbers().map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => handleSearch(pageNum)}
                                className={`px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 ${
                                  currentPage === pageNum
                                    ? 'bg-primary-600 text-white shadow-md hover:shadow-lg hover:shadow-primary-500/25'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>

                          {/* Next Page */}
                          {currentPage < totalPages && (
                            <button
                              onClick={() => handleSearch(currentPage + 1)}
                              className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition-colors duration-150"
                            >
                              다음
                            </button>
                          )}

                          {/* Last Page */}
                          {currentPage < totalPages - 1 && (
                            <button
                              onClick={() => handleSearch(totalPages)}
                              className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium transition-colors duration-150"
                            >
                              끝
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
