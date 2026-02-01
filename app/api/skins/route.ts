import { NextRequest, NextResponse } from 'next/server';
import { findAllSkins, countSkins } from '@/lib/db/skins';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const skins = await findAllSkins({
      includeInactive,
    });

    return NextResponse.json({
      success: true,
      skins,
    });
  } catch (error) {
    console.error('Error fetching skins:', error);
    return NextResponse.json(
      {
        success: false,
        error: '스킨 목록을 불러오는데 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Note: This is a simplified version. In production, you'd need:
    // 1. File upload handling for ZIP files
    // 2. Skin validation
    // 3. Unzip and store files
    // 4. Generate thumbnails
    
    const data = await request.json();
    
    return NextResponse.json({
      success: false,
      error: '스킨 업로드는 현재 지원되지 않습니다. ZIP 파일 업로드 기능을 추가해야 합니다.',
    }, { status: 501 });
    
  } catch (error) {
    console.error('Error uploading skin:', error);
    return NextResponse.json(
      { success: false, error: '스킨 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
