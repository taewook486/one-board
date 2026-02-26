import { NextRequest, NextResponse } from 'next/server';
import { getAllMembers, countMembers, searchMembers } from '@/lib/db/members';
import { z } from 'zod';
import logger from '@/lib/utils/logger';

// Validation schema for query parameters
const getMembersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.coerce.number().int().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validatedData = getMembersSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const { page, limit, status, search } = validatedData;
    const offset = (page - 1) * limit;

    let members;
    let total;

    if (search) {
      // Search mode
      members = await searchMembers(search, limit);
      total = members.length;
    } else {
      // List mode with optional status filter
      members = await getAllMembers({
        limit,
        offset,
        status,
      });

      total = await countMembers({
        status,
      });
    }

    return NextResponse.json({
      success: true,
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    logger.error('Error fetching members:', error);
    return NextResponse.json(
      {
        success: false,
        error: '회원 목록을 불러오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
