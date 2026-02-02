import { NextRequest, NextResponse } from 'next/server';
import { findBoardById, updateBoard, deleteBoard, updateBoardOrder } from '@/lib/db/boards';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema
const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  boardKey: z.string().min(1).max(50).optional(),
  category: z.string().optional(),
  icon: z.string().optional(),
  skinId: z.number().optional().nullable(),
  readPermission: z.number().int().min(0).max(2).optional(),
  writePermission: z.number().int().min(0).max(2).optional(),
  commentPermission: z.number().int().min(0).max(2).optional(),
  allowFileUpload: z.boolean().optional(),
  maxFileCount: z.number().int().min(0).optional(),
  maxFileSize: z.number().int().min(0).optional(),
  allowedFileTypes: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/boards/[id] - Get a specific board
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    const board = await findBoardById(boardId);

    if (!board) {
      return NextResponse.json(
        { error: '게시판을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      board,
    });
  } catch (error) {
    console.error('Get board error:', error);

    return NextResponse.json(
      { error: '게시판을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/boards/[id] - Update a board (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    // Get user role from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Check if user is admin
    if (sessionUser.role !== 2) {
      return NextResponse.json(
        { error: '관리자만 게시판을 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateBoardSchema.parse(body);

    // Update board
    const updatedBoard = await updateBoard(boardId, validatedData);

    return NextResponse.json({
      success: true,
      board: updatedBoard,
      message: '게시판이 수정되었습니다.',
    });
  } catch (error) {
    console.error('Update board error:', error);

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
      { error: '게시판 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/boards/[id] - Delete a board (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boardId = parseInt(id);

    // Get user role from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const sessionUser = JSON.parse(sessionCookie.value);

    // Check if user is admin
    if (sessionUser.role !== 2) {
      return NextResponse.json(
        { error: '관리자만 게시판을 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    await deleteBoard(boardId);

    return NextResponse.json({
      success: true,
      message: '게시판이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete board error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '게시판 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
