import { NextRequest, NextResponse } from 'next/server';
import {
  findCommentById,
  updateComment,
  deleteComment,
  incrementCommentLikeCount,
  canDeleteComment,
  canEditComment,
} from '@/lib/db/comments';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema
const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
});

/**
 * GET /api/comments/[id] - Get a specific comment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    const comment = await findCommentById(commentId);

    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Get comment error:', error);

    return NextResponse.json(
      { error: '댓글을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/comments/[id] - Update a comment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    // Get user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Check if comment exists
    const comment = await findCommentById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check permission
    const canEdit = await canEditComment(commentId, sessionUser.id);
    if (!canEdit) {
      return NextResponse.json(
        { error: '댓글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateCommentSchema.parse(body);

    // Update comment
    const updatedComment = await updateComment(commentId, validatedData);

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      message: '댓글이 수정되었습니다.',
    });
  } catch (error) {
    console.error('Update comment error:', error);

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
      { error: '댓글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id] - Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    // Get user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Check permission
    const canDelete = await canDeleteComment(commentId, sessionUser.id);
    if (!canDelete) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    await deleteComment(commentId);

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete comment error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments/[id]/like - Like a comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = parseInt(id);

    const comment = await findCommentById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await incrementCommentLikeCount(commentId);

    return NextResponse.json({
      success: true,
      message: '좋아요가 추가되었습니다.',
    });
  } catch (error) {
    console.error('Like comment error:', error);

    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
