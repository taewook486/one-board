'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '@/lib/utils/common';

interface Post {
  id: number;
  title: string;
  content: string;
  boardName: string;
  boardKey: string;
  boardId: number;
  memberId: number | null;
  authorName: string | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isNotice: boolean;
  isPinned: boolean;
  isSecret: boolean;
  status: number;
  category: string | null;
  tags: string | null;
}

interface Board {
  id: number;
  boardKey: string;
  name: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        all: 'true',
        limit: '20',
        offset: ((page - 1) * 20).toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      if (data.success) {
        setPosts(data.posts || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.error || '게시글 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchQuery]);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards');
      const data = await res.json();
      if (data.success) {
        setBoards(data.boards || []);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchBoards();
  }, [fetchPosts]);

  const handleSearch = () => {
    setPage(1);
    fetchPosts();
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('게시글이 삭제되었습니다.');
        fetchPosts();
      } else {
        toast.error(data.error || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('게시글 삭제에 실패했습니다.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) {
      toast.error('삭제할 게시글을 선택해주세요.');
      return;
    }

    if (!confirm(`${selectedPosts.length}개의 게시글을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch('/api/posts/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedPosts }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${selectedPosts.length}개의 게시글이 삭제되었습니다.`);
        setSelectedPosts([]);
        fetchPosts();
      } else {
        toast.error(data.error || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error bulk deleting posts:', error);
      toast.error('게시글 삭제에 실패했습니다.');
    }
  };

  const handleTogglePin = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-pin' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || '고정 상태가 변경되었습니다.');
        fetchPosts();
      } else {
        toast.error(data.error || '고정 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('고정 상태 변경에 실패했습니다.');
    }
  };

  const handleToggleSecret = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-secret' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || '비밀 상태가 변경되었습니다.');
        fetchPosts();
      } else {
        toast.error(data.error || '비밀 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error toggling secret:', error);
      toast.error('비밀 상태 변경에 실패했습니다.');
    }
  };

  const handleToggleNotice = async (postId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-notice' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || '공지 상태가 변경되었습니다.');
        fetchPosts();
      } else {
        toast.error(data.error || '공지 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error toggling notice:', error);
      toast.error('공지 상태 변경에 실패했습니다.');
    }
  };

  const handleToggleStatus = async (postId: number, newStatus: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('게시글 상태가 변경되었습니다.');
        fetchPosts();
      } else {
        toast.error(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleMovePost = async (postId: number, targetBoardId: number) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move', targetBoardId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('게시글이 이동되었습니다.');
        fetchPosts();
      } else {
        toast.error(data.error || '게시글 이동에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error moving post:', error);
      toast.error('게시글 이동에 실패했습니다.');
    }
  };

  const openModal = (post?: Post) => {
    setEditingPost(post || null);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">삭제</span>;
      case 1:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">활성</span>;
      case 2:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">숨김</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">알 수 없음</span>;
    }
  };

  const getBoardName = (boardId: number, boardKey: string) => {
    const board = boards.find(b => b.id === boardId);
    return board?.name || boardKey;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // 해제
      setSelectedPosts([]);
    } else {
      // 전체 선택 - 현재 페이지의 게시글만 선택
      setSelectedPosts(posts.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectIndividual = (postId: number) => {
    setSelectedPosts(prev => {
      const newSelected = prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId];

      // selectAll 상태 업데이트: 모든 게시글이 선택되면 true, 아니면 false
      setSelectAll(newSelected.length === posts.length && posts.length > 0);

      return newSelected;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">게시글 관리</h1>
              <p className="mt-1 text-sm text-gray-500">게시글 목록, 상태 관리, 삭제, 이동</p>
            </div>
            <button
              onClick={() => {
                resetFilters();
                fetchPosts();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                id="search"
                placeholder="제목, 내용, 작성자"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="1">활성</option>
                <option value="2">숨김</option>
                <option value="0">삭제</option>
              </select>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="notice">공지</option>
                <option value="secret">비밀</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  if (selectedPosts.length > 0) {
                    handleBulkDelete();
                  }
                }}
                disabled={selectedPosts.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                선택 삭제 ({selectedPosts.length})
              </button>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600">
                  총 {totalPages}페이지 중 {page}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">게시글이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* Actions Bar */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label htmlFor="selectAll" className="text-sm text-gray-700">전체 선택</label>
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {posts.length}개 게시글
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectAll && posts.length > 0 && selectedPosts.length === posts.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      게시판
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={() => handleSelectIndividual(post.id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <div className="font-medium text-gray-900 truncate">
                            {post.isNotice && (
                              <span className="text-orange-600 mr-2">[공지]</span>
                            )}
                            {post.isPinned && (
                              <span className="text-blue-600 mr-2">[고정]</span>
                            )}
                            {post.isSecret && (
                              <span className="text-gray-500 mr-2">[비밀]</span>
                            )}
                            <Link
                              href={`/board/${post.boardKey}/${post.id}`}
                              className="text-blue-600 hover:text-blue-900 hover:underline truncate"
                            >
                              {post.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {post.category && (
                              <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                                {post.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.authorName || '익명'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getBoardName(post.boardId, post.boardKey)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-gray-900">{post.viewCount}</span>
                          <span className="text-gray-500">👁</span>
                          <span className="text-gray-900">{post.likeCount}</span>
                          <span className="text-gray-500">👍</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleNotice(post.id)}
                            className={`text-lg ${post.isNotice ? 'text-orange-600' : 'text-gray-400'} hover:text-orange-600`}
                            title={post.isNotice ? '공지 취소' : '공지로 설정'}
                          >
                            📢
                          </button>
                          <button
                            onClick={() => handleTogglePin(post.id)}
                            className={`text-lg ${post.isPinned ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600`}
                            title={post.isPinned ? '고정 해제' : '고정'}
                          >
                            📌
                          </button>
                          <button
                            onClick={() => handleToggleSecret(post.id)}
                            className={`text-lg ${post.isSecret ? 'text-gray-600' : 'text-gray-400'} hover:text-gray-600`}
                            title={post.isSecret ? '비밀 해제' : '비밀로 설정'}
                          >
                            🔒
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/board/${post.boardKey}/${post.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 border border-blue-200"
                            title="게시글 보기"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            보기
                          </Link>
                          <div className="relative group">
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-300"
                              title="게시글 상태 변경"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              상태
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <div className="absolute left-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(post.id, 1);
                                  }}
                                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                                  disabled={post.status === 1}
                                >
                                  {post.status === 1 && <span className="text-green-600">✓</span>}
                                  활성
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(post.id, 2);
                                  }}
                                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                                  disabled={post.status === 2}
                                >
                                  {post.status === 2 && <span className="text-blue-600">✓</span>}
                                  숨김
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(post.id, 0);
                                  }}
                                  className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50"
                                  disabled={post.status === 0}
                                >
                                  {post.status === 0 && <span className="text-gray-600">✓</span>}
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openModal(post)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 border border-gray-300"
                            title="다른 게시판으로 이동"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            이동
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('이 게시글을 삭제하시겠습니까?')) {
                                handleDelete(post.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 border border-red-700 shadow-sm hover:shadow"
                            title="게시글 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          페이지 <span className="font-medium">{page}</span> /{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            이전
                          </button>
                          <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            다음
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Change Modal */}
        {isModalOpen && editingPost && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsModalOpen(false)}
              ></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    게시글 상태 변경: {editingPost.title}
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      이 게시글의 상태를 변경하시겠습니까?
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        onClick={() => {
                          handleToggleStatus(editingPost.id, 1);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={editingPost.status === 1}
                      >
                        게시글 활성
                      </button>
                      <button
                        onClick={() => {
                          handleToggleStatus(editingPost.id, 2);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={editingPost.status === 2}
                      >
                        게시글 숨김
                      </button>
                      <button
                        onClick={() => {
                          handleToggleStatus(editingPost.id, 0);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={editingPost.status === 0}
                      >
                        비활성
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
