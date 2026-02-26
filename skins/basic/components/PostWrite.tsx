'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { BoardPost } from '@/lib/db';

// Dynamic import Editor
const ClientEditor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>,
});

// Validation schema
const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.').max(255),
  content: z.string().min(1, '내용을 입력해주세요.'),
  category: z.string().optional(),
  tags: z.string().optional(),
  isNotice: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isSecret: z.boolean().default(false),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostWriteProps {
  post?: BoardPost;
  boardKey: string;
  boardId: number;
  allowNotice?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export default function PostWrite({
  post,
  boardKey,
  boardId,
  allowNotice = false,
  onImageUpload,
}: PostWriteProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: post ? {
      title: post.title,
      content: post.content,
      category: post.category || '',
      tags: post.tags || '',
      isNotice: post.isNotice || false,
      isPinned: post.isPinned || false,
      isSecret: post.isSecret || false,
    } : {
      title: '',
      content: '',
      category: '',
      tags: '',
      isNotice: false,
      isPinned: false,
      isSecret: false,
    },
  });

  const onSubmit = async (data: PostFormData) => {
    try {
      setSubmitting(true);

      const payload = {
        ...data,
        boardId,
      };

      const url = post ? `/api/posts/${post.id}` : '/api/posts';
      const method = post ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '게시글 저장에 실패했습니다.');
      }

      router.push(`/board/${boardKey}/${result.post.id}`);
    } catch (error) {
      console.error('Post save error:', error);
      alert(error instanceof Error ? error.message : '게시글 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!onImageUpload) {
      throw new Error('이미지 업로드 기능이 없습니다.');
    }
    return onImageUpload(file);
  };

  return (
    <div className="space-y-6 bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900">
        {post ? '게시글 수정' : '게시글 작성'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목 *
          </label>
          <input
            {...register('title')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="제목을 입력하세요"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <input
              {...register('category')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="카테고리 (선택)"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              태그
            </label>
            <input
              {...register('tags')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="태그 (콤마로 구분)"
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            내용 *
          </label>
          <ClientEditor
            content={watch('content')}
            onChange={(content) => setValue('content', content)}
            onImageUpload={onImageUpload}
            placeholder="내용을 입력하세요..."
            editable={!submitting}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Options */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allowNotice && (
              <label className="flex items-center">
                <input
                  {...register('isNotice')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">공지사항</span>
              </label>
            )}

            <label className="flex items-center">
              <input
                {...register('isPinned')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">고정글</span>
            </label>

            <label className="flex items-center">
              <input
                {...register('isSecret')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">비밀글</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 border-t pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '저장 중...' : post ? '수정' : '작성'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
