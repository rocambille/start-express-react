# Mutations, CSRF & Cache Invalidation

This reference documents how to execute data mutations (POST, PUT, DELETE) and handle cache invalidation in StartER.

---

## The `mutate()` Helper

All mutative requests in StartER must go through `mutate()` located in `src/react/helpers/mutate.ts`:

```typescript
import { mutate } from "../../helpers/mutate";

await mutate(
  url,        // string: e.g. "/api/items"
  method,     // "post" | "put" | "delete"
  body?,      // optional payload: plain object or FormData
  paths?,     // optional string | string[]: cache paths to invalidate
);
```

---

## 1. Automatic CSRF Protection

StartER uses the **Client-Side Double-Submit Cookie** pattern:
- `mutate()` calls `csrfToken()`, which ensures an active UUID token exists in the secure cookie `__Host-x-csrf-token` (with `SameSite=strict` and `Path=/`).
- It automatically attaches that exact token in the `X-CSRF-Token` HTTP header on every POST, PUT, and DELETE request.
- The server's CSRF middleware validates that the cookie value matches the header value.

> [!NOTE]
> You **never** need to manually retrieve, store, or attach CSRF tokens in React components. `mutate()` manages the entire lifecycle seamlessly.

---

## 2. JSON vs FormData Payloads

`mutate()` automatically inspects the `body` parameter:

### Standard JSON Mutations
```typescript
const addItem = async (data: ItemDTO) => {
  await mutate("/api/items", "post", data, ["/api/items"]);
  navigate("/items");
};
```
- Sets `Content-Type: application/json`.
- Serializes body with `JSON.stringify(body)`.

### Multipart / File Upload Mutations
```typescript
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  await mutate("/api/users/me/avatar", "post", formData, ["/api/users/me"]);
};
```
- Leaves `Content-Type` header unset so the browser automatically sets `multipart/form-data; boundary=...`.
- Sends raw `FormData` without JSON serialization.

---

## 3. Cache Invalidation via `paths`

The 4th argument of `mutate()` takes resource path(s) to invalidate upon successful response:

```typescript
// Single path:
await mutate("/api/items/1", "delete", undefined, "/api/items");

// Multiple related paths:
await mutate(`/api/items/${id}`, "put", updatedData, [
  "/api/items",           // Evicts paginated item lists
  `/api/items/${id}`,     // Evicts specific item detail
]);
```

### Invalidation Semantics:
1. `refresh(paths)` deletes all cached Promises whose keys match or start with the specified path.
2. It immediately notifies any mounted component subscribed via `useRefresh(matchingPath)`.
3. Subscribed components re-render, trigger a new `getOrFetch()`, and re-suspend until the fresh data arrives.
4. Components not subscribed to those paths are completely unaffected.

---

## 4. Component Form Pattern

To maximize reusability, StartER components separate the form UI from the mutation action:

```tsx
// ItemForm.tsx (reusable for both create and edit)
interface ItemFormProps {
  defaultValue?: Partial<Item>;
  action: (data: ItemDTO) => Promise<void>;
  children: React.ReactNode; // Injects the submit button
}

function ItemForm({ defaultValue, action, children }: ItemFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    await action({ title });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="title">Title</label>
      <input
        id="title"
        name="title"
        defaultValue={defaultValue?.title ?? ""}
        required
      />
      {children}
    </form>
  );
}

// ItemEdit.tsx
function ItemEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  useRefresh(`/api/items/${id}`);

  const item = use(getOrFetch<Item>(`/api/items/${id}`));

  const editItem = async (data: ItemDTO) => {
    await mutate(`/api/items/${id}`, "put", data, [
      "/api/items",
      `/api/items/${id}`,
    ]);
    navigate(`/items/${id}`);
  };

  return (
    <ItemForm defaultValue={item} action={editItem}>
      <button type="submit">Save Changes</button>
    </ItemForm>
  );
}
```
