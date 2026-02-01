import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, uploadMultipleFiles } from '@/lib/upload/fileUploader';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다.' },
        { status: 400 }
      );
    }

    const postId = formData.get('postId')
      ? parseInt(formData.get('postId') as string)
      : undefined;
    const commentId = formData.get('commentId')
      ? parseInt(formData.get('commentId') as string)
      : undefined;
    const memberId = formData.get('memberId')
      ? parseInt(formData.get('memberId') as string)
      : undefined;
    const isTemp = formData.get('isTemp') === 'true';

    // Upload files
    const uploadResult = await uploadMultipleFiles(files, {
      postId,
      commentId,
      memberId,
      isTemp,
      maxFiles: 10,
    });

    if (uploadResult.failCount > 0) {
      return NextResponse.json({
        success: false,
        message: `${uploadResult.successCount}개 파일 업로드 성공, ${uploadResult.failCount}개 실패`,
        results: uploadResult.results,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadResult.successCount}개 파일 업로드 성공`,
      results: uploadResult.results,
    });
  } catch (error) {
    console.error('File upload error:', error);

    return NextResponse.json(
      { error: '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
