import { NextRequest, NextResponse } from 'next/server';
import {
  createComment,
  findCommentsByPostId,
  findCommentsTreeByPostId,
  getCommentsByMember,
  getRecentComments,
} from '@/lib/db/comments';
import { requireAuth } from '@/lib/auth/helper';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema
const createCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1).max(5000),
  parentId: z.number().optional().nullable(),
});

/**
 * GET /api/comments - Get comments
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Handle recent comments
    if (searchParams.has('recent')) {
      const limit = parseInt(searchParams.get('limit') || '20');

      const comments = await getRecentComments(limit);

      return NextResponse.json({
        success: true,
        comments,
      });
    }

    // Handle member comments
    if (searchParams.has('memberId')) {
      const memberId = parseInt(searchParams.get('memberId')!);
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      const comments = await getCommentsByMember(memberId, {
        limit,
        offset,
      });

      return NextResponse.json({
        success: true,
        comments,
      });
    }

    // Handle post comments
    const postId = searchParams.get('postId');
    if (!postId) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const tree = searchParams.get('tree') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let comments;
    if (tree) {
      comments = await findCommentsTreeByPostId(parseInt(postId));
    } else {
      comments = await findCommentsByPostId(parseInt(postId), {
        limit,
        offset,
      });
    }

    return NextResponse.json({
      success: true,
      comments,
      postId: parseInt(postId),
      tree,
    });
  } catch (error) {
    logger.error('Get comments error:', error);

    return NextResponse.json(
      { error: '댓글 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments - Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const sessionUser = await requireAuth();

    const body = await request.json();

    // Validate input
    const validatedData = createCommentSchema.parse(body);

    // Create comment
    const newComment = await createComment({
      ...validatedData,
      memberId: sessionUser.id,
      authorName: null,
      authorPassword: null,
    });

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: '댓글이 작성되었습니다.',
    });
  } catch (error) {
    logger.error('Create comment error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
