import React from 'react';

interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number, cursor: string | null) => void;
  hasNextPage: boolean;
  nextCursor: string | null;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  onPageChange,
  hasNextPage,
  nextCursor,
}) => {
  return (
    <nav className="flex justify-center items-center gap-4 mt-8 select-none">
      <button
        className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-50"
        onClick={() => onPageChange(currentPage - 1, null)}
        disabled={currentPage === 1}
      >
        Prev
      </button>

      <span className="text-lg font-semibold text-[#E6B325]">
        Page {currentPage}
      </span>

      <button
        className="px-3 py-1 rounded bg-gray-800 text-white disabled:opacity-50"
        onClick={() => onPageChange(currentPage + 1, nextCursor)}
        disabled={!hasNextPage}
      >
        Next
      </button>
    </nav>
  );
};
