/*
  Purpose:
  Render page navigation links for paginated resources.

  Responsibilities:
  - Compute total pages from total and pageSize
  - Render Previous / numbered page / Next links
  - Mark the current page with aria-current
  - Keep the other search params (search, filters, sort) when changing page

  Design notes:
  - Uses <Link to="?page=N"> so navigation updates the URL (browser history,
    SSR, shareable links) without any JavaScript state
  - currentPage comes from props; the parent already computed it from the URL
  - Renders nothing when total <= pageSize (no pagination needed)
*/

import { Link, useSearchParams } from "react-router";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

function Pagination({ total, pageSize, currentPage }: PaginationProps) {
  const [searchParams] = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  // "?q=stuff&page=3": change the page, keep the rest
  const toPage = (page: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));

    return `?${next.toString()}`;
  };

  return (
    <nav aria-label="Pagination">
      {currentPage > 1 && <Link to={toPage(currentPage - 1)}>Previous</Link>}

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          to={toPage(page)}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link to={toPage(currentPage + 1)}>Next</Link>
      )}
    </nav>
  );
}

export default Pagination;
