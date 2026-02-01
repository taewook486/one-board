import { NextRequest, NextResponse } from 'next/server';
import { findAllBoards, createBoard, updateBoard, deleteBoard, getBoardCategories } from '@/lib/db/boards';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schema
const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  boardKey: z.string().min(1).max(50),
  category: z.string().optional(),
  icon: z.string().optional(),
  skinId: z.number().optional().nullable(),
  readPermission: z.number().int().min(0).max(2).default(0),
  writePermission: z.number().int().min(0).max(2).default(1),
  commentPermission: z.number().int().min(0).max(2).default(1),
  allowFileUpload: z.boolean().default(true),
  maxFileCount: z.number().int().min(0).default(5),
  maxFileSize: z.number().int().min(0).default(5242880),
  allowedFileTypes: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

const updateBoardSchema = createBoardSchema.partial().extend({
  id: z.number(),
});

/**
 * GET /api/boards - Get all boards
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;

    const boards = await findAllBoards({ category });

    return NextResponse.json({
      success: true,
      boards,
    });
  } catch (error) {
    console.error('Get boards error:', error);

    return NextResponse.json(
      { error: '게시판 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/boards - Create a new board (admin only)
 */
export async function POST(request: NextRequest) {
  try {
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
        { error: '관리자만 게시판을 생성할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createBoardSchema.parse(body);

    // Create board
    const newBoard = await createBoard(validatedData);

    return NextResponse.json({
      success: true,
      board: newBoard,
      message: '게시판이 생성되었습니다.',
    });
  } catch (error) {
    console.error('Create board error:', error);

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
      { error: '게시판 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
