'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Editor from '@/components/editor/Editor';

// Validation schema
const postSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.')
    .max(255, '제목은 최대 255자까지 가능합니다.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
  category: z.string().optional(),
  tags: z.string().optional(),
  isNotice: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isSecret: z.boolean().default(false),
});

type PostFormData = z.infer<typeof postSchema>;

export default function WriteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardKey = searchParams.get('board') || '';
  const postId = searchParams.get('postId');
  const [isEdit, setIsEdit] = useState(false);
  const [board, setBoard] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      tags: '',
      isNotice: false,
      isPinned: false,
      isSecret: false,
    },
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all boards
        const res = await fetch('/api/boards');
        const data = await res.json();

        if (data.success) {
          const allBoards = data.boards || [];
          setBoards(allBoards);

          if (boardKey) {
            const foundBoard = allBoards.find((b: any) => b.boardKey === boardKey);
            if (foundBoard) {
              setBoard(foundBoard);
            } else {
              toast.error('게시판을 찾을 수 없습니다.');
            }
          }
        }

        if (postId) {
          setIsEdit(true);
          const postRes = await fetch(`/api/posts/${postId}`);
          const postData = await postRes.json();

          if (postData.success) {
            setPost(postData.post);
            setValue('title', postData.post.title);
            setValue('content', postData.post.content);
            setValue('category', postData.post.category || '');
            setValue('tags', postData.post.tags || '');
            setValue('isNotice', postData.post.isNotice);
            setValue('isPinned', postData.post.isPinned);
            setValue('isSecret', postData.post.isSecret);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [boardKey, postId, setValue]);

  const onSubmit = async (data: PostFormData) => {
    try {
      setSubmitting(true);

      const payload = {
        ...data,
        boardId: board?.id,
      };

      const url = isEdit ? `/api/posts/${postId}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

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

      toast.success(isEdit ? '게시글이 수정되었습니다.' : '게시글이 작성되었습니다.');
      router.push(`/board/${board?.boardKey || boardKey}/${result.post.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '게시글 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('isTemp', 'false');
    formData.append('memberId', '0');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success || !result.results || result.results.length === 0) {
      throw new Error(result.error || '이미지 업로드에 실패했습니다.');
    }

    return result.results[0].url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show board selection if no board is specified
  if (!boardKey && boards.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">게시판 선택</h1>
            <p className="text-gray-600 mb-6">게시글을 작성할 게시판을 선택해주세요.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((b) => (
                <Link
                  key={b.id}
                  href={`/write?board=${b.boardKey}`}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-2xl mb-2">{b.icon || '📋'}</div>
                  <div className="font-semibold text-gray-900">{b.name}</div>
                  {b.description && (
                    <div className="text-sm text-gray-500 mt-1">{b.description}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no boards available
  if (!boardKey && boards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">게시판 없음</h1>
            <p className="text-gray-600 mb-6">사용 가능한 게시판이 없습니다.</p>
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/board/${board?.boardKey || boardKey}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← {board?.name || '게시판'} 돌아가기
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {isEdit ? '게시글 수정' : '게시글 작성'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white shadow rounded-lg p-6">
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
            <Editor
              content={watch('content')}
              onChange={(content) => setValue('content', content)}
              onImageUpload={handleImageUpload}
              placeholder="내용을 입력하세요..."
              editable={!submitting}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* Options */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  {...register('isNotice')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">공지사항</span>
              </label>

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
          <div className="flex gap-4 border-t pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '저장 중...' : isEdit ? '수정' : '작성'}
            </button>

            <Link
              href={`/board/${board?.boardKey || boardKey}`}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-center font-medium"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
