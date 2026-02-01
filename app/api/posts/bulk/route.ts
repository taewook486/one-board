import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { boardPosts } from '@/lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

/**
 * DELETE /api/posts/bulk - Bulk delete multiple posts (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 게시글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Delete all posts
    await db
      .delete(boardPosts)
      .where(sql`id IN (${ids.map(id => String(id)).join(',')})`);

    return NextResponse.json({
      success: true,
      message: `${ids.length}개의 게시글이 삭제되었습니다.`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error('Bulk delete posts error:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
