import { NextRequest, NextResponse } from 'next/server';
import { incrementLikeCount } from '@/lib/db/posts';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = request.headers;
    const userId = headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Increment like count
    await incrementLikeCount(parseInt(id));

    return NextResponse.json({
      success: true,
      message: '좋아요가 등록되었습니다.',
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { success: false, error: '좋아요에 실패했습니다.' },
      { status: 500 }
    );
  }
}
