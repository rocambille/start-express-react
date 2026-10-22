---
name: starter-react-dataflow
description: >-
  Use this skill when creating, modifying, or debugging React components in StartER
  that fetch data, execute mutations, use forms, handle pagination, subscribe to cache
  updates, or interact with user authentication session state. Enforces React 19 use(),
  getOrFetch(), mutate(), useRefresh(), Range headers, and pure idempotent rendering.
---

# React Dataflow & Component Architecture in StartER

StartER implements a lightweight, zero-dependency dataflow architecture built specifically for **React 19** and isomorphic SSR. It eliminates legacy state management libraries (`TanStack Query`, `Axios`, `SWR`, `Redux`) in favor of native Promises, `<Suspense>`, and targeted in-memory reactivity.

Follow this guide whenever reading from or writing to APIs within React components.

---

## The React 19 Paradigm Shift

> [!CAUTION]
> **Avoid legacy React patterns:**
> - ❌ **Never** use `useEffect` + `useState` to fetch data or track loading/error flags.
> - ❌ **Never** install or import external query/state libraries (`axios`, `@tanstack/react-query`, `swr`).
> - ❌ **Never** execute side-effects or state mutations before or around `use()`.

In StartER:
- **Pending state** is handled automatically by the nearest `<Suspense fallback={<Loading />}>`.
- **Error state** is handled automatically by the nearest `<ErrorBoundary>`.
- **Data fetching** is colocated inside components using `use(getOrFetch<T>(url))`.

---

## Core Dataflow Primitives

### 1. Reading Data (`getOrFetch` & `use`)

To fetch data, pass the Promise returned by `getOrFetch` to React 19's native `use()`:

```tsx
import { use } from "react";
import { getOrFetch } from "../../helpers/cache";

function ItemShow() {
  const { id } = useParams();

  // Suspends until resolved; shares cached Promise instance across renders
  const item = use(getOrFetch<Item>(`/api/items/${id}`));

  return <h1>{item.title}</h1>;
}
```

#### Why `getOrFetch()` is Required
Calling `use(fetch(...))` directly would instantiate a new Promise on every render cycle, causing an infinite suspension loop. `getOrFetch()` memoizes Promises in an in-memory cache (`promisesByUrl`), guaranteeing that concurrent render passes share the exact same Promise identity.

**Options**:
- `headers`: custom request headers (e.g. `Range`).
- `parse`: custom response parser (defaults to `res.json()`).
- `ttl`: time-to-live in ms (defaults to 5 minutes / `300_000` ms).

---

### 2. Targeted Reactivity (`useRefresh`)

When a resource is modified, subscribed components must re-suspend and display fresh data without re-rendering unrelated parts of the app.

Add `useRefresh` at the top of components that read cached data:

```tsx
import { useRefresh } from "../../helpers/cache";

function ItemList() {
  // Subscribes this component to cache invalidation on "/api/items"
  useRefresh("/api/items");

  const items = use(getOrFetch<Item[]>("/api/items"));
  // ...
}
```

- When `refresh("/api/items")` is triggered, subscribed components re-render and re-suspend with a fresh Promise.
- Multiple paths can be watched: `useRefresh(["/api/items", `/api/items/${id}`])`.

---

### 3. Writing Data & Mutations (`mutate`)

All POST, PUT, and DELETE operations must use `mutate` from `src/react/helpers/mutate.ts`:

```tsx
import { mutate } from "../../helpers/mutate";

const saveItem = async (data: ItemDTO) => {
  await mutate(
    `/api/items/${id}`,   // URL
    "put",                 // Method: "post" | "put" | "delete"
    data,                  // Request body (JSON object or FormData)
    ["/api/items", `/api/items/${id}`] // Paths to invalidate in cache
  );

  navigate(`/items/${id}`);
};
```

> [!IMPORTANT]
> Consult [mutation-and-csrf.md](./references/mutation-and-csrf.md) for full details on multipart file uploads, double-submit CSRF cookie mechanics, and reusable form patterns.
>
> - **CSRF Handled Automatically**: `mutate()` secures the request using the `__Host-x-csrf-token` cookie and `X-CSRF-Token` header.
> - **Automatic Invalidation**: The 4th parameter (`paths`) automatically evicts stale cache entries and alerts subscribers.

---

### 4. URL-Driven Range Pagination

StartER uses HTTP Range headers (RFC 7233) rather than enveloped JSON objects:

```tsx
import { use } from "react";
import { useSearchParams } from "react-router";
import { getOrFetch, useRefresh } from "../../helpers/cache";
import { parseContentRangeTotal } from "../../helpers/pagination";
import Pagination from "../Pagination";

const PAGE_SIZE = 10;

function ItemList() {
  useRefresh("/api/items");

  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

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
      <ul>{items.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </>
  );
}
```

> [!IMPORTANT]
> Consult [pagination-patterns.md](./references/pagination-patterns.md) for complete details on HTTP 206 Partial Content, Content-Range parsing, and edge cases.

---

### 5. User Authentication Session (`useMe`)

Centralized user authentication state is exposed through the `useMe()` hook (`src/react/components/auth/MeContext.tsx`):

```tsx
import { useMe } from "../auth/MeContext";

function ActionsMenu({ item }: { item: Item }) {
  const { user, isAuthenticated } = useMe();

  const isOwner = isAuthenticated && user?.id === item.user_id;

  return (
    <div>
      {isOwner && <Link to={`/items/${item.id}/edit`}>Edit</Link>}
    </div>
  );
}
```

**Exposed properties & helpers**:
- `user`: `User | null`
- `isAuthenticated`: `boolean`
- `sendMagicLink(email)`: triggers magic login email
- `verifyMagicLink(token)`: verifies token and logs in
- `logout()`: clears session cookie
- `updateMe(data)`: updates user profile
- `updateMeAvatar(file)`: uploads avatar

---

### 6. SSR & Hydration Guardrails

StartER pre-renders pages on the server before client-side hydration:
1. **No Direct Browser Globals**: Never read `window`, `document`, or `localStorage` during initial render.
2. **Pure Renders**: Do not call `navigate()` or trigger state updates during render. Place them in event handlers, form actions, or `useEffect`.
3. **Idempotence**: A component may render multiple times while resolving suspended Promises. Keep render bodies pure.
