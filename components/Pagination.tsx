'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisible?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisible = 5,
}: PaginationProps) {
  const getPageNumbers = () => {
    const delta = maxVisible / 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const shouldShowEllipsisBefore = currentPage > maxVisible / 2 + 1;
  const shouldShowEllipsisAfter = currentPage < totalPages - maxVisible / 2;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-border-light dark:border-border-dark">
      <div className="text-sm text-text-sub-light dark:text-text-sub-dark">
        Showing {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {/* First Button */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-sub-light dark:text-text-sub-dark text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:exact-[2]"
          >
            <span className="material-symbols-outlined text-[16px]">first_page</span>
          </button>
        )}

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-sub-light dark:text-text-sub-dark text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>

        {/* Page Numbers */}
        {shouldShowEllipsisBefore && (
          <span className="px-2 text-text-sub-light dark:text-text-sub-dark">...</span>
        )}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
              currentPage === page
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-sub-light dark:text-text-sub-dark hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {page}
          </button>
        ))}
        {shouldShowEllipsisAfter && (
          <span className="px-2 text-text-sub-light dark:text-text-sub-dark">...</span>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-sub-light dark:text-text-sub-dark text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>

        {/* Last Button */}
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-sub-light dark:text-text-sub-dark text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:exact-[2]"
          >
            <span className="material-symbols-outlined text-[16px]">last_page</span>
          </button>
        )}
      </div>
    </div>
  );
}
