'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

interface Member {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  profileImage: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    name: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchMember = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.authenticated && data.user) {
        setMember({
          id: data.user.id,
          username: data.user.username,
          nickname: data.user.nickname,
          email: data.user.email,
          name: null,
          phone: null,
          profileImage: data.user.profileImage,
          createdAt: new Date().toISOString(),
        });
        setFormData({
          nickname: data.user.nickname || '',
          email: data.user.email || '',
          name: '',
          phone: '',
        });
      } else {
        toast.error(data.error || '회원 정보를 불러오는데 실패했습니다.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      toast.error('회원 정보를 불러오는데 실패했습니다.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/members/${member?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('프로필이 저장되었습니다.');
        setMember({ ...member, ...data.member });
        setIsEditing(false);
      } else {
        toast.error(data.error || '프로필 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('프로필 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword.length < 8) {
      toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/members/${member?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('비밀번호가 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        toast.error(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('isTemp', 'false');
    formData.append('memberId', member?.id?.toString() || '0');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.results && data.results.length > 0) {
        if (member) {
          setMember({ ...member, profileImage: data.results[0].url });
        }
        toast.success('프로필 이미지가 업로드되었습니다.');
      } else {
        toast.error(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">프로필</h1>
          <p className="mt-1 text-gray-600">
            회원 정보를 관리하고 수정할 수 있습니다.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : member ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden relative">
                      {member.profileImage ? (
                        <Image
                          src={member.profileImage}
                          alt={member.nickname}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <span className="text-3xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.nickname}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{member.username}
                      </p>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="px-4 pb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로필 이미지
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="block w-full text-sm text-gray-500
                          file:mr-4
                          file:text-gray-500
                          file:rounded-md
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      PNG, JPG, JPEG, GIF (최대 5MB)
                    </p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      아이디
                    </label>
                    <div className="text-sm text-gray-900 font-medium">
                      {member.username}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <div className="text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{member.name || '-'}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      닉네임
                    </label>
                    <div className="text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.nickname}
                          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{member.nickname}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <div className="text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{member.email || '-'}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호
                    </label>
                    <div className="text-sm text-gray-900">
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{member.phone || '-'}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      가입일
                    </label>
                    <div className="text-sm text-gray-900">
                      {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                      >
                        수정
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleProfileUpdate}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? '저장 중...' : '저장'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              nickname: member.nickname,
                              email: member.email || '',
                              name: member.name || '',
                              phone: member.phone || '',
                            });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                          >
                            취소
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Posts & Comments */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">작성한 게시글</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-600">작성한 댓글</p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 링크</h2>
                <div className="space-y-2">
                  <Link
                    href={`/board?authorId=${member.id}`}
                    className="block p-3 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">내 작성글</div>
                    <p className="text-xs text-gray-500">내가 작성한 모든 게시글 보기</p>
                  </Link>
                  <Link
                    href={`/board?authorId=${member.id}`}
                    className="block p-3 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">내 댓글</div>
                    <p className="text-xs text-gray-500">내가 작성한 모든 댓글 보기</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}
