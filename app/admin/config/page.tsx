'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Config {
  key: string;
  value: string;
  type: 'text' | 'number' | 'boolean';
  parsedValue: string | number | boolean;
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      const data = await res.json();

      if (data.success) {
        setConfigs(data.configs || []);
      } else {
        toast.error(data.error || '설정 정보를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('설정 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          configs: configs.map(c => ({
            value: String(c.value),
            type: c.type,
          })).reduce((acc, c, i) => ({
            ...acc,
            [configs[i].key]: c,
          }), {}),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('설정이 저장되었습니다.');
        fetchConfigs();
      } else {
        toast.error(data.error || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error('설정 저장에 실패했습니다.');
    }
  };

  const handleReset = async () => {
    if (!confirm('모든 설정을 기본값으로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('설정이 초기화되었습니다.');
        fetchConfigs();
      } else {
        toast.error(data.error || '설정 초기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error resetting configs:', error);
      toast.error('설정 초기화에 실패했습니다.');
    }
  };

  const renderInput = (config: Config, index: number) => {
    switch (config.type) {
      case 'boolean':
        return (
          <select
            value={config.value}
            onChange={(e) => {
              const newConfigs = [...configs];
              newConfigs[index].value = e.target.value;
              setConfigs(newConfigs);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={config.value}
            onChange={(e) => {
              const newConfigs = [...configs];
              newConfigs[index].value = e.target.value;
              setConfigs(newConfigs);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      default:
        return (
          <input
            type="text"
            value={config.value}
            onChange={(e) => {
              const newConfigs = [...configs];
              newConfigs[index].value = e.target.value;
              setConfigs(newConfigs);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  const getConfigLabel = (key: string) => {
    const labels: Record<string, string> = {
      'site.name': '사이트 이름',
      'site.description': '사이트 설명',
      'site.defaultSkin': '기본 스킨',
      'posts.itemsPerPage': '게시글 표시 개수',
      'comments.itemsPerPage': '댓글 표시 개수',
      'members.allowRegistration': '회원가입 허용',
      'members.allowGuest': '비회원 허용',
    };
    return labels[key] || key;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">시스템 설정</h1>
              <p className="mt-1 text-sm text-gray-500">사이트 설정 관리</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                기본값으로 초기화
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configs Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : configs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">설정이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설정 키
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설정명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 값
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수정
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config, index) => (
                  <tr key={config.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {config.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getConfigLabel(config.key)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {config.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {String(config.parsedValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-64">
                      {renderInput(config, index)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
