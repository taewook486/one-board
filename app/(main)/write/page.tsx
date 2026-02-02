import { Suspense } from 'react';
import WriteClient from '@/components/WriteClient';

export const dynamic = 'force-dynamic';

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <WriteClient />
    </Suspense>
  );
}
