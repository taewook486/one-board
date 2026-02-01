import { NextRequest, NextResponse } from 'next/server';
import { getConfig, deleteConfig } from '@/lib/db/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const value = await getConfig(decodeURIComponent(params.key));

    if (value === null) {
      return NextResponse.json(
        { success: false, error: '설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      key: params.key,
      value,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { success: false, error: '설정 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    await deleteConfig(decodeURIComponent(params.key));

    return NextResponse.json({
      success: true,
      message: '설정이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    return NextResponse.json(
      { success: false, error: '설정 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
