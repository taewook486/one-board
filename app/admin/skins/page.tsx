'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Skin {
  id: number;
  name: string;
  version: string;
  description: string;
  config: any;
  isActive: boolean;
  createdAt: string;
}

export default function AdminSkinsPage() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkin, setEditingSkin] = useState<Skin | null>(null);

  const fetchSkins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/skins');
      const data = await res.json();

      if (data.success) {
        setSkins(data.skins || []);
      } else {
        toast.error(data.error || '스킨 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching skins:', error);
      toast.error('스킨 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkins();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const payload = {
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      description: formData.get('description') as string,
      config: formData.get('config') as string,
      isActive: formData.get('isActive') === 'true',
    };

    try {
      const url = editingSkin ? `/api/skins/${editingSkin.id}` : '/api/skins';
      const method = editingSkin ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingSkin ? '스킨이 수정되었습니다.' : '스킨이 생성되었습니다.');
        setIsModalOpen(false);
        setEditingSkin(null);
        fetchSkins();
      } else {
        toast.error(data.error || '스킨 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving skin:', error);
      toast.error('스킨 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (skinId: number) => {
    if (!confirm('이 스킨을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/skins/${skinId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('스킨이 삭제되었습니다.');
        fetchSkins();
      } else {
        toast.error(data.error || '스킨 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting skin:', error);
      toast.error('스킨 삭제에 실패했습니다.');
    }
  };

  const openModal = (skin?: Skin) => {
    setEditingSkin(skin || null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">스킨 관리</h1>
              <p className="mt-1 text-sm text-gray-500">스킨 업로드, 편집, 삭제, 미리보기</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + 스킨 생성
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Skins Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : skins.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">스킨이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skins.map((skin) => (
              <div key={skin.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{skin.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">버전 {skin.version}</p>
                    </div>
                    {skin.isActive && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        활성
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-gray-700">{skin.description}</p>
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => openModal(skin)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => handleDelete(skin.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                    {editingSkin ? '스킨 수정' : '스킨 생성'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        스킨 이름 *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        defaultValue={editingSkin?.name || ''}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: Basic, Dark, Minimal"
                      />
                    </div>

                    <div>
                      <label htmlFor="version" className="block text-sm font-medium text-gray-700">
                        버전 *
                      </label>
                      <input
                        type="text"
                        name="version"
                        id="version"
                        defaultValue={editingSkin?.version || '1.0.0'}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 1.0.0"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        설명
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        defaultValue={editingSkin?.description || ''}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="스킨에 대한 설명"
                      />
                    </div>

                    <div>
                      <label htmlFor="config" className="block text-sm font-medium text-gray-700">
                        설정 (JSON)
                      </label>
                      <textarea
                        name="config"
                        id="config"
                        defaultValue={editingSkin?.config ? JSON.stringify(editingSkin.config, null, 2) : '{}'}
                        rows={6}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder='{"colors": {...}, "fonts": {...}}'
                      />
                    </div>

                    <div>
                      <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
                        활성 상태
                      </label>
                      <select
                        name="isActive"
                        id="isActive"
                        defaultValue={editingSkin?.isActive ? 'true' : 'false'}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingSkin ? '수정' : '생성'}
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
  );
}
