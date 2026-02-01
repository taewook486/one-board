'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Board {
  id: number;
  boardKey: string;
  name: string;
  description: string;
  displayOrder: number;
  skin: string;
  skinId: number | null;
  readPermission: number;
  writePermission: number;
  commentPermission: number;
  allowFileUpload: boolean;
  maxFileCount: number;
  maxFileSize: number;
  allowedFileTypes: string | null;
  postCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminBoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/boards');
      const data = await res.json();

      if (data.success) {
        setBoards(data.boards || []);
      } else {
        toast.error(data.error || '게시판 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast.error('게시판 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

      const payload = {
        boardKey: formData.get('boardKey') as string,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        displayOrder: parseInt(formData.get('displayOrder') as string),
        readPermission: parseInt(formData.get('readPermission') as string),
        writePermission: parseInt(formData.get('writePermission') as string),
        commentPermission: parseInt(formData.get('commentPermission') as string),
        skinId: formData.get('skin') ? parseInt(formData.get('skin') as string) : null,
      };

    try {
      const url = editingBoard ? `/api/boards/${editingBoard.id}` : '/api/boards';
      const method = editingBoard ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingBoard ? '게시판이 수정되었습니다.' : '게시판이 생성되었습니다.');
        setIsModalOpen(false);
        setEditingBoard(null);
        fetchBoards();
      } else {
        toast.error(data.error || '게시판 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving board:', error);
      toast.error('게시판 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (boardId: number) => {
    if (!confirm('이 게시판을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('게시판이 삭제되었습니다.');
        fetchBoards();
      } else {
        toast.error(data.error || '게시판 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('게시판 삭제에 실패했습니다.');
    }
  };

  const openModal = (board?: Board) => {
    setEditingBoard(board || null);
    setIsModalOpen(true);
  };

  const getPermissionLabel = (permission: number) => {
    switch (permission) {
      case 0:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">전체</span>;
      case 1:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">회원</span>;
      case 2:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">관리자</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">알 수 없음</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">게시판 관리</h1>
              <p className="mt-1 text-sm text-gray-500">게시판 생성, 수정, 삭제, 순서 변경</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + 게시판 생성
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Boards Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : boards.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">게시판이 없습니다.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    키
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    스킨
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    읽기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    쓰기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    댓글
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boards.map((board) => (
                  <tr key={board.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {board.displayOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {board.boardKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{board.name}</div>
                      <div className="text-sm text-gray-500">{board.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {board.skin || '기본'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPermissionLabel(board.readPermission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPermissionLabel(board.writePermission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPermissionLabel(board.commentPermission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          board.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {board.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(board)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(board.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
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
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      {editingBoard ? '게시판 수정' : '게시판 생성'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="boardKey" className="block text-sm font-medium text-gray-700">
                          게시판 키 *
                        </label>
                        <input
                          type="text"
                          name="boardKey"
                          id="boardKey"
                          defaultValue={editingBoard?.boardKey || ''}
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: notice, general"
                          disabled={!!editingBoard}
                        />
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          게시판 이름 *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          defaultValue={editingBoard?.name || ''}
                          required
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 공지사항, 자유게시판"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          설명
                        </label>
                        <input
                          type="text"
                          name="description"
                          id="description"
                          defaultValue={editingBoard?.description || ''}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="게시판에 대한 설명"
                        />
                      </div>

                      <div>
                        <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
                          표시 순서
                        </label>
                        <input
                          type="number"
                          name="displayOrder"
                          id="displayOrder"
                          defaultValue={editingBoard?.displayOrder || 0}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="skin" className="block text-sm font-medium text-gray-700">
                          스킨
                        </label>
                        <input
                          type="text"
                          name="skin"
                          id="skin"
                          defaultValue={editingBoard?.skin || 'basic'}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: basic, dark"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="readPermission" className="block text-sm font-medium text-gray-700">
                            읽기 권한
                          </label>
                          <select
                            name="readPermission"
                            id="readPermission"
                            defaultValue={editingBoard?.readPermission || 0}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>전체</option>
                            <option value={1}>회원</option>
                            <option value={2}>관리자</option>
                          </select>
                        </div>
 
                        <div>
                          <label htmlFor="writePermission" className="block text-sm font-medium text-gray-700">
                            쓰기 권한
                          </label>
                          <select
                            name="writePermission"
                            id="writePermission"
                            defaultValue={editingBoard?.writePermission || 1}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>전체</option>
                            <option value={1}>회원</option>
                            <option value={2}>관리자</option>
                          </select>
                        </div>
 
                        <div>
                          <label htmlFor="commentPermission" className="block text-sm font-medium text-gray-700">
                            댓글 권한
                          </label>
                          <select
                            name="commentPermission"
                            id="commentPermission"
                            defaultValue={editingBoard?.commentPermission || 1}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>전체</option>
                            <option value={1}>회원</option>
                            <option value={2}>관리자</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingBoard ? '수정' : '생성'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setIsModalOpen(false)}
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
