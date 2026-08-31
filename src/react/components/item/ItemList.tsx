/*
  Purpose:
  Display the list of items and expose navigation to item-related pages.

  Responsibilities:
  - Fetch the current page of items via a Range request header
  - Render a list UI with pagination controls
  - Conditionally expose the "create item" entry point based on authentication

  Design notes:
  - PAGE_SIZE is a local constant — a UI decision, not a server concern
  - ?page=N in the URL keeps page state in the browser history and
    makes the link shareable; SSR reads the same param and renders correctly
  - The Range header is computed from the page number before the API call;
    the server knows nothing about pages
  - No direct data fetching logic in the component
  - Authentication concerns are read-only (check, not mutate)
*/

import { use } from "react";
import { Link, useSearchParams } from "react-router";
import { getOrFetch, parseContentRangeTotal } from "../../helpers/cache";
import { useMe } from "../auth/MeContext";
import Pagination from "../Pagination";

const PAGE_SIZE = 10;

function ItemList() {
  /*
    Authentication state:
    - Used only to decide what actions are visible
    - No redirects or side effects here
  */
  const { isAuthenticated } = useMe();

  /*
    Page state:
    - Read from URL search params so the page is bookmarkable and SSR-safe
    - `|| 1` handles NaN (?page=foo) and 0 (?page=0);
      negative values produce invalid Range headers the server rejects with 416
  */
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  /*
    Items collection:
    - Retrieved with a Range request header; the server responds with
      Content-Range carrying the total count
    - Suspends while loading (via `use`)
    - Forgotten after mutations (forget("/api/items") clears all pages)
  */
  const { items, total } = use(
    getOrFetch<{ items: Item[]; total: number }>("/api/items", {
      headers: { Range: `items=${start}-${end}` },
      parse: async (res) => ({
        items: await res.json(),
        total: parseContentRangeTotal(res.headers.get("Content-Range")),
      }),
    }),
  );

  return (
    <>
      <h1>Items</h1>

      {/* Entry point for authenticated users */}
      {isAuthenticated && (
        <Link to="/items/new" data-testid="items-new">
          Add
        </Link>
      )}

      {/* Item list */}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>

      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </>
  );
}

export default ItemList;
