/*
  Purpose:
  Render page navigation links for paginated resources.

  Responsibilities:
  - Compute total pages from total and pageSize
  - Render Previous / numbered page / Next links
  - Mark the current page with aria-current

  Design notes:
  - Uses <Link to="?page=N"> so navigation updates the URL (browser history,
    SSR, shareable links) without any JavaScript state
  - currentPage comes from props; the parent already computed it from the URL
  - Renders nothing when total <= pageSize (no pagination needed)
*/

import { Link } from "react-router";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

function Pagination({ total, pageSize, currentPage }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination">
      {currentPage > 1 && <Link to={`?page=${currentPage - 1}`}>Previous</Link>}

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          to={`?page=${page}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link to={`?page=${currentPage + 1}`}>Next</Link>
      )}
    </nav>
  );
}

export default Pagination;
