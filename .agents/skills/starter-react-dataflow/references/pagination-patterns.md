# HTTP Range Pagination in React

This reference documents how to implement pagination in React components using HTTP Range headers (RFC 7233 / RFC 9110) and URL search parameters.

---

## Architectural Principles

1. **Clean Payloads**: The API response body remains a clean array of entities (`Item[]`), not an enveloped object (`{ items: [...], total: 42 }`).
2. **Standard Headers**:
   - Client sends: `Range: <unit>=<start>-<end>` (e.g. `Range: items=0-9`)
   - Server returns: `206 Partial Content` with `Content-Range: <unit> <start>-<end>/<total>` (e.g. `Content-Range: items 0-9/42`)
3. **URL as State**: The current page is stored in `?page=N`. This makes URLs bookmarkable, preserves browser history (Back/Forward buttons work without extra code), and ensures SSR renders the correct slice.
4. **Separation of Concerns**:
   - The server is page-agnostic: it only computes offsets (`offset = start`, `limit = end - start + 1`).
   - The client defines `PAGE_SIZE` (a UI layout decision) and converts page numbers into range offsets.

---

## Component Implementation Pattern

```tsx
import { use } from "react";
import { Link, useSearchParams } from "react-router";
import { getOrFetch, useRefresh } from "../../helpers/cache";
import { parseContentRangeTotal } from "../../helpers/pagination";
import Pagination from "../Pagination";

const PAGE_SIZE = 10;

function ItemList() {
  // 1. Subscribe to refresh events for this endpoint
  useRefresh("/api/items");

  // 2. Read page from URL (?page=1 by default)
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  // 3. Fetch slice with Range header and parse Content-Range header
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
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>

      {/* 4. Render pagination navigation */}
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </>
  );
}

export default ItemList;
```

---

## Cache Key Mechanics

In `src/react/helpers/cache.ts`:
- The cache key includes the serialized request headers:
  ```typescript
  const cacheKey = options?.headers
    ? `${url}\0${JSON.stringify(options.headers)}`
    : url;
  ```
- Because `headers: { Range: "items=0-9" }` and `headers: { Range: "items=10-19" }` produce different cache keys, each page is cached independently while navigating.
- When `refresh("/api/items")` is called after a mutation, all cache keys starting with `/api/items` are automatically evicted, ensuring every page reflects the updated data.

---

## Edge Cases & Defensive Coding

1. **Malformed or Missing Query Param**:
   - `Number(searchParams.get("page")) || 1` safely handles:
     - Missing `?page` → `1`
     - `?page=foo` (NaN) → `1`
     - `?page=0` → `1`
2. **Out of Range (`416 Range Not Satisfiable`)**:
   - If a user requests a page beyond total records (e.g. `?page=9999`), the server returns HTTP `416`.
   - The rejection bubbles up to the nearest `<ErrorBoundary>` which displays the error page.
3. **Empty Collection / Single Page**:
   - The `<Pagination />` component automatically renders `null` when `total <= pageSize`, avoiding unnecessary controls.
