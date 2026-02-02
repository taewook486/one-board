'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Member {
  id: number;
  username: string;
  nickname: string;
  email: string;
  role: number;
  status: number;
  createdAt: string;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/members?${params}`);
      const data = await res.json();

      if (data.success) {
        setMembers(data.members);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || '회원 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMembers();
  }, [page, statusFilter, searchQuery, fetchMembers]);

  const handleLock = async (memberId: number, reason: string = '') => {
    if (!confirm('이 회원의 계정을 정지하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock', reason }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('계정이 정지되었습니다.');
        fetchMembers();
      } else {
        toast.error(data.error || '계정 정지에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error locking member:', error);
      toast.error('계정 정지에 실패했습니다.');
    }
  };

  const handleUnlock = async (memberId: number) => {
    if (!confirm('이 회원의 계정을 해제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('계정이 해제되었습니다.');
        fetchMembers();
      } else {
        toast.error(data.error || '계정 해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error unlocking member:', error);
      toast.error('계정 해제에 실패했습니다.');
    }
  };

  const handleDelete = async (memberId: number, role: number) => {
    if (role === 2) {
      toast.error('관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm('이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('회원이 삭제되었습니다.');
        fetchMembers();
      } else {
        toast.error(data.error || '회원 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('회원 삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">활성</span>;
      case 1:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">정지</span>;
      case 2:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">삭제</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">알 수 없음</span>;
    }
  };

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 0:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">일반</span>;
      case 1:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">회원</span>;
      case 2:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">관리자</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">알 수 없음</span>;
    }
  };

  return (
    <>
    <div className="flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 bg-white shadow-sm border-b border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
    </div>

    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Filters */}
      <div className="p-6 flex flex-col md:flex-row gap-4 border-b border-gray-200">
        <div className="flex-1">
          <input
            type="text"
            placeholder="이름, 아이디, 닉네임, 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setPage(1)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체</option>
          <option value="active">활성</option>
          <option value="suspended">정지</option>
          <option value="deleted">삭제</option>
        </select>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      번호
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      아이디
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      닉네임
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-center">{member.id}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{member.username}</td>
                      <td className="px-6 py-4 text-gray-900">{member.nickname}</td>
                      <td className="px-6 py-4 text-gray-900">{member.email}</td>
                      <td className="px-6 py-4 text-center">
                        {member.role === 0 && <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">일반회원</span>}
                        {member.role === 1 && <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">우수회원</span>}
                        {member.role === 2 && <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">관리자</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {member.status === 1 && <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">활성</span>}
                        {member.status === 2 && <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">정지</span>}
                        {member.status === 0 && <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">삭제</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div>
                  Showing page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:exact-[2] disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
