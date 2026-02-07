'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils/common';
import toast from 'react-hot-toast';
import CommentList from '@/components/comments/CommentList';

interface User {
  id: number;
  username: string;
  nickname: string;
  role: number;
  profileImage?: string | null;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorName: string | null;
  memberId: number | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isNotice: boolean;
  isPinned: boolean;
  isSecret: boolean;
  boardId: number;
  category: string | null;
  tags?: string;
}

interface Board {
  id: number;
  name: string;
  boardKey: string;
}

interface AdjacentPosts {
  previous?: { id: number; title: string };
  next?: { id: number; title: string };
}

interface PostDetailClientProps {
  boardKey: string;
  postId: string;
}

export default function PostDetailClient({ boardKey, postId }: PostDetailClientProps) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [adjacent, setAdjacent] = useState<AdjacentPosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch session
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.authenticated) {
          setSessionUser(authData.user);
        }

        // Fetch post details
        const postResponse = await fetch(
          `/api/posts/${postId}`,
          { cache: 'no-store' }
        );
        const postData = await postResponse.json();

        if (postData.success) {
          setPost(postData.post);
          setLikeCount(postData.post.likeCount);
          setAdjacent(postData.adjacent || null);
        } else {
          toast.error(postData.error || '게시글을 찾을 수 없습니다.');
          router.push(`/board/${boardKey}`);
          return;
        }

        // Fetch comments
        const commentsResponse = await fetch(
          `/api/comments?postId=${postId}&tree=true`,
          { cache: 'no-store' }
        );
        const commentsData = await commentsResponse.json();

        if (commentsData.success) {
          setComments(commentsData.comments || []);
        }

        // Fetch board info
        const boardResponse = await fetch('/api/boards');
        const boardsData = await boardResponse.json();
        if (boardsData.success) {
          const foundBoard = boardsData.boards?.find((b: any) => b.id === postData.post?.boardId);
          setBoard(foundBoard || null);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [postId, boardKey, router]);

  const handleLike = async () => {
    if (!sessionUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post?.id}/like`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      } else {
        toast.error(data.error || '좋아요에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('좋아요에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!canEdit && !canDelete) {
      toast.error('삭제 권한이 없습니다.');
      return;
    }

    if (!confirm('이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/posts/${post?.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        toast.success('게시글이 삭제되었습니다.');
        router.push(`/board/${board?.boardKey || boardKey}`);
      } else {
        toast.error(data.error || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = sessionUser && post ? (sessionUser.id === post.memberId || sessionUser.role === 2) : false;
  const canDelete = sessionUser && post ? (sessionUser.id === post.memberId || sessionUser.role === 2) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            게시글을 찾을 수 없습니다.
          </h1>
          <Link
            href={`/board/${boardKey}`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                홈
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/board/${boardKey}`}
                className="text-gray-500 hover:text-gray-700"
              >
                {board?.name || '게시판'}
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">게시글 상세</li>
          </ol>
        </nav>

        {/* Post Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {post.isNotice && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                    공지
                  </span>
                )}
                {post.isPinned && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded ml-2">
                    고정
                  </span>
                )}
                <h1 className="mt-2 text-2xl font-bold text-gray-900">
                  {post.title}
                </h1>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Link
                    href={`/write?postId=${post.id}&board=${boardKey}`}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  >
                    수정
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="font-medium text-gray-900">
                {post.authorName || '작성자'}
              </span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              <span>조회 {post.viewCount}</span>
              {post.category && (
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {post.category}
                </span>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="px-6 py-4">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Post Tags */}
          {post.tags && (
            <div className="px-6 pb-4 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Post Footer */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <button
                  onClick={handleLike}
                  disabled={!sessionUser}
                  className={`flex items-center gap-1 ${
                    liked ? 'text-red-600' : 'text-gray-600 hover:text-blue-600'
                  } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{liked ? '❤️' : '👍'}</span>
                  <span>{likeCount}</span>
                </button>
              </div>

              {/* Adjacent posts */}
              {adjacent && (
                <div className="flex gap-4 text-sm">
                  {adjacent.previous && (
                    <Link
                      href={`/board/${boardKey}/${adjacent.previous.id}`}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      ← 이전글
                    </Link>
                  )}
                  {adjacent.next && (
                    <Link
                      href={`/board/${boardKey}/${adjacent.next.id}`}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      다음글 →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentList
          comments={comments}
          postId={parseInt(postId)}
          sessionUser={sessionUser}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
