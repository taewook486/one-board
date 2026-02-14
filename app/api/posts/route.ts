import { NextRequest, NextResponse } from 'next/server';
import {
  createPost,
  findPostsByBoard,
  searchPosts,
  getRecentPosts,
  countPosts,
} from '@/lib/db/posts';
import { PostStatus } from '@/lib/db/schema';
import { requireAuth, requireAdmin } from '@/lib/auth/helper';
import { z } from 'zod';

// Validation schema
const createPostSchema = z.object({
  boardId: z.number(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.string().optional(),
  isNotice: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isSecret: z.boolean().default(false),
});

const searchSchema = z.object({
  query: z.string().min(1),
  boardId: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

/**
 * GET /api/posts - Get posts (list, search, or recent)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Handle search
    if (searchParams.has('query')) {
      const query = searchParams.get('query');
      const boardId = searchParams.get('boardId')
        ? parseInt(searchParams.get('boardId')!)
        : undefined;
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      const validatedData = searchSchema.parse({
        query,
        boardId,
        limit,
        offset,
      });

      const posts = await searchPosts(validatedData.query, {
        boardId: validatedData.boardId,
        limit: validatedData.limit,
        offset: validatedData.offset,
      });

      return NextResponse.json({
        success: true,
        posts,
        query: validatedData.query,
      });
    }

    // Handle recent posts
    if (searchParams.has('recent')) {
      const limit = parseInt(searchParams.get('limit') || '20');

      const posts = await getRecentPosts(limit);

      return NextResponse.json({
        success: true,
        posts,
      });
    }

    // Handle admin all posts
    if (searchParams.has('all')) {
      // Admin authorization check
      const sessionUser = await requireAdmin();

      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
      const status = searchParams.get('status')
        ? parseInt(searchParams.get('status')!)
        : undefined;
      const search = searchParams.get('search') || undefined;
      const category = searchParams.get('category') || undefined;

      const { getAllPosts } = await import('@/lib/db/posts');
      const result = await getAllPosts({
        limit,
        offset,
        status,
        search,
        category,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Handle board posts
    const boardId = searchParams.get('boardId');
    if (!boardId) {
      return NextResponse.json(
        { error: '게시판 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') as
      | 'createdAt'
      | 'viewCount'
      | 'likeCount'
      | 'commentCount' || 'createdAt';
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
    const category = searchParams.get('category') || undefined;
    const memberId = searchParams.get('memberId')
      ? parseInt(searchParams.get('memberId')!)
      : undefined;

    const posts = await findPostsByBoard(parseInt(boardId), {
      limit,
      offset,
      sortBy,
      order,
      category,
      memberId,
    });

    // Get total count for pagination
    const { countPosts } = await import('@/lib/db/posts');
    const total = await countPosts({
      boardId: parseInt(boardId),
      category,
      status: PostStatus.ACTIVE
    });

    return NextResponse.json({
      success: true,
      posts,
      total,
      boardId: parseInt(boardId),
    });
  } catch (error) {
    console.error('Get posts error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '게시글 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts - Create a new post (member only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const sessionUser = await requireAuth();

    const body = await request.json();

    // Validate input
    const validatedData = createPostSchema.parse(body);

    // Create post
    const newPost = await createPost({
      ...validatedData,
      memberId: sessionUser.id,
      authorName: sessionUser.nickname || sessionUser.username,
      authorPassword: null,
    });

    return NextResponse.json({
      success: true,
      post: newPost,
      message: '게시글이 작성되었습니다.',
    });
  } catch (error) {
    console.error('Create post error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const statusCode = error.message === '인증이 필요합니다.' ? 401 : 400;
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: '게시글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
