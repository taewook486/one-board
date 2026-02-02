'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from './Pagination';

interface BoardPaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function BoardPagination({
  currentPage,
  totalPages,
}: BoardPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
