'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Validation schema
const registerSchema = z.object({
  username: z.string().min(3, '아이디는 최소 3자 이상이어야 합니다.')
    .max(50, '아이디는 최대 50자까지 가능합니다.')
    .regex(/^[a-zA-Z0-9_-]+$/, '아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다.'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요.').optional(),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/[A-Z]/, '비밀번호에는 최소 1개의 대문자가 포함되어야 합니다.')
    .regex(/[a-z]/, '비밀번호에는 최소 1개의 소문자가 포함되어야 합니다.')
    .regex(/[0-9]/, '비밀번호에는 최소 1개의 숫자가 포함되어야 합니다.')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, '비밀번호에는 최소 1개의 특수문자가 포함되어야 합니다.'),
  passwordConfirm: z.string(),
  nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.')
    .max(50, '닉네임은 최대 50자까지 가능합니다.')
    .regex(/^[가-힣a-zA-Z0-9\s]+$/, '닉네임에는 한글, 영문, 숫자만 사용할 수 있습니다.'),
  name: z.string().max(100).optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const username = watch('username');
  const email = watch('email');
  const nickname = watch('nickname');

  // Debounced check functions
  const checkUsernameAvailable = async (username: string) => {
    if (!username || username.length < 3) return;

    try {
      setCheckingUsername(true);
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (!data.available) {
        toast.error('이미 사용 중인 아이디입니다.');
      }
    } catch (error) {
      console.error('Username check error:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const checkEmailAvailable = async (email: string) => {
    if (!email || !email.includes('@')) return;

    try {
      setCheckingEmail(true);
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!data.available) {
        toast.error('이미 사용 중인 이메일입니다.');
      }
    } catch (error) {
      console.error('Email check error:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const checkNicknameAvailable = async (nickname: string) => {
    if (!nickname || nickname.length < 2) return;

    try {
      setCheckingNickname(true);
      const response = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
      const data = await response.json();

      if (!data.available) {
        toast.error('이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      console.error('Nickname check error:', error);
    } finally {
      setCheckingNickname(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '회원가입에 실패했습니다.');
      }

      toast.success('회원가입이 완료되었습니다! 로그인해주세요.');
      router.push('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            One Board에 오신 것을 환영합니다!
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                아이디 *
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="아이디 입력 (3자 이상)"
                  onBlur={(e) => checkUsernameAvailable(e.target.value)}
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="이메일 주소 (선택)"
                  onBlur={(e) => checkEmailAvailable(e.target.value)}
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호 *
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호 입력"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Password Confirm */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 *
              </label>
              <div className="mt-1">
                <input
                  {...register('passwordConfirm')}
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호 재입력"
                />
              </div>
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm.message}</p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임 *
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('nickname')}
                  type="text"
                  autoComplete="nickname"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="닉네임 입력 (2자 이상)"
                  onBlur={(e) => checkNicknameAvailable(e.target.value)}
                />
                {checkingNickname && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                실명
              </label>
              <div className="mt-1">
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="실명 입력 (선택)"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
