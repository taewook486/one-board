import { NextRequest, NextResponse } from 'next/server';
import { getAllMembers, countMembers, searchMembers } from '@/lib/db/members';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

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
        status: status ? parseInt(status) : undefined,
      });

      total = await countMembers({
        status: status ? parseInt(status) : undefined,
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
    console.error('Error fetching members:', error);
    return NextResponse.json(
      {
        success: false,
        error: '회원 목록을 불러오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
