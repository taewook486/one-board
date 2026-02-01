'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('비밀번호 재설정 링크가 이메일로 발송되었습니다.');
        setIsSubmitted(true);
      } else {
        toast.error(data.error || '요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast.error('요청에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.83 0l6.5-6.5a2 2 0 002.83 0L16 16a2 2 0 002.83 0l-6.5-6.5a2 2 0 002.83 0zM6 18V6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                이메일 전송 완료
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {email} 주소로 비밀번호 재설정 링크를 전송했습니다.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                이메일을 확인해주세요. (개발 환경에서는 콘솔에 링크가 표시됩니다)
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-6 w-full flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                다른 이메일로 시도
              </button>
              <Link
                href="/login"
                className="mt-4 block w-full text-center text-blue-600 hover:text-blue-800 font-medium"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white shadow rounded-lg p-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '전송 중...' : '비밀번호 재설정 링크 받기'}
              </button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                회원가입
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
