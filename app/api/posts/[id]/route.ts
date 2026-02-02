import { NextRequest, NextResponse } from 'next/server';
import {
  findPostById,
  updatePost,
  deletePost,
  incrementViewCount,
  getAdjacentPosts,
  canAccessPost,
} from '@/lib/db/posts';
import { db } from '@/lib/db';
import { boardPosts, boards } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema for admin actions only
const adminActionSchema = z.object({
  action: z.enum(['toggle-pin', 'toggle-secret', 'toggle-notice', 'update-status', 'move']),
  status: z.number().optional(),
  targetBoardId: z.number().optional(),
});

// Validation schema for regular updates
const regularUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  isNotice: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isSecret: z.boolean().optional(),
});



/**
 * GET /api/posts/[id] - Get a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    const post = await findPostById(postId);
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if user can access the post (for secret posts)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    const sessionUser = sessionCookie ? JSON.parse(sessionCookie.value) : null;

    if (post.isSecret && !canAccessPost(post.id, sessionUser?.id)) {
      return NextResponse.json(
        { error: '비밀글입니다.' },
        { status: 403 }
      );
    }

    // Increment view count
    await incrementViewCount(postId);

    // Get adjacent posts
    const adjacentPosts = await getAdjacentPosts(postId, post.boardId);

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        canEdit: sessionUser && (sessionUser.id === post.memberId || sessionUser.role === 2),
        canDelete: sessionUser && (sessionUser.id === post.memberId || sessionUser.role === 2),
      },
      adjacentPosts,
    });
  } catch (error) {
    console.error('Get post error:', error);

    return NextResponse.json(
      { error: '게시글을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[id] - Update a post
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

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

    // Check if post exists
    const post = await findPostById(postId);
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check permission (author or admin)
    if (post.memberId !== sessionUser.id && sessionUser.role !== 2) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input using regular update schema
    const validatedData = regularUpdateSchema.parse(body);

    // Update post
    const updatedPost = await updatePost(postId, validatedData);

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: '게시글이 수정되었습니다.',
    });
  } catch (error) {
    console.error('Update post error:', error);

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
      { error: '게시글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id] - Delete a post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

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

    // Check if post exists
    const post = await findPostById(postId);
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check permission (author or admin)
    if (post.memberId !== sessionUser.id && sessionUser.role !== 2) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    await deletePost(postId);

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete post error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[id] - Admin actions (toggle pin, secret, notice, status, move)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);
    
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
    
    // Check admin role
    if (sessionUser.role !== 2) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // Check if post exists
    const post = await findPostById(postId);
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = adminActionSchema.parse(body);
    const { action, status, targetBoardId } = validatedData;

    switch (action) {
      case 'toggle-pin':
        const result = await db
          .update(boardPosts)
          .set({
            isPinned: !post.isPinned,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(boardPosts.id, postId))
          .returning();
        const updated = result[0];
        return NextResponse.json({
          success: true,
          post: updated,
          message: post.isPinned ? '게시글이 고정 해제되었습니다.' : '게시글이 고정되었습니다.',
        });

      case 'toggle-secret':
        const resultSecret = await db
          .update(boardPosts)
          .set({
            isSecret: !post.isSecret,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(boardPosts.id, postId))
          .returning();
        const updatedSecret = resultSecret[0];
        return NextResponse.json({
          success: true,
          post: updatedSecret,
          message: post.isSecret ? '게시글이 비밀 해제되었습니다.' : '게시글이 비밀로 설정되었습니다.',
        });

      case 'toggle-notice':
        const resultNotice = await db
          .update(boardPosts)
          .set({
            isNotice: !post.isNotice,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(boardPosts.id, postId))
          .returning();
        const updatedNotice = resultNotice[0];
        return NextResponse.json({
          success: true,
          post: updatedNotice,
          message: post.isNotice ? '게시글 공지가 해제되었습니다.' : '게시글이 공지로 설정되었습니다.',
        });

      case 'update-status':
        if (status === undefined) {
          return NextResponse.json(
            { error: '상태값이 필요합니다.' },
            { status: 400 }
          );
        }
        const updatedStatus = await db
          .update(boardPosts)
          .set({
            status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(boardPosts.id, postId))
          .returning();
        
        return NextResponse.json({
          success: true,
          post: updatedStatus[0],
          message: '게시글 상태가 변경되었습니다.',
        });

      case 'move':
        if (targetBoardId === undefined) {
          return NextResponse.json(
            { error: '이동할 게시판 ID가 필요합니다.' },
            { status: 400 }
          );
        }
        // Verify target board exists
        const targetBoard = await db
          .select()
          .from(boards)
          .where(eq(boards.id, targetBoardId))
          .get();
        
        if (!targetBoard) {
          return NextResponse.json(
            { error: '이동할 게시판을 찾을 수 없습니다.' },
            { status: 404 }
          );
        }
        
        const updatedMove = await db
          .update(boardPosts)
          .set({
            boardId: targetBoardId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(boardPosts.id, postId))
          .returning();
        
        return NextResponse.json({
          success: true,
          post: updatedMove[0],
          message: '게시글이 이동되었습니다.',
        });

      default:
        return NextResponse.json(
          { error: '잘못된 액션입니다.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin action error:', error);
    
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
      { error: '액션 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
