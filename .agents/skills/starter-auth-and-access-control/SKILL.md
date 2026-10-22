---
name: starter-auth-and-access-control
description: >-
  Use this skill when implementing authentication, protecting routes, verifying resource
  ownership, enforcing role-based access control (RBAC), accessing req.me, or configuring
  trusted identity injection in StartER to prevent IDOR security vulnerabilities.
---

# Authentication & Access Control in StartER

StartER implements a stateless, cookie-based passwordless authentication model (**Magic Link**) combined with a strict **4-layer defense-in-depth access control architecture**.

Follow this guide whenever securing endpoints, verifying user ownership, or accessing user session state.

---

## The 4-Layer Defense-in-Depth Model

Every secured request passes through four explicit security boundaries before reaching controller actions:

```
Request: PUT /api/items/42
  │
  ▼
[ Layer 1: ParamConverter ] ────> Resolves :itemId into req.item (404 fast-fail if not found)
  │
  ▼
[ Layer 2: Authentication Wall ] > Verifies __Host-auth cookie JWT, loads & injects req.me (401 if missing)
  │
  ▼
[ Layer 3: Authorization Guard ] ─> Checks ownership: req.item.user_id === req.me.id (403 if mismatch)
  │
  ▼
[ Layer 4: Edge Validation ] ────> Validates DTO & forcefully injects req.me.id into req.body (Prevents IDOR)
  │
  ▼
[ Action Controller ] ──────────> Operates on trusted, fully-typed req.body and req.item
```

---

## 1. The Golden Security Rule: Never Trust Client User IDs

> [!CAUTION]
> **Accepting `user_id` from client payloads causes Insecure Direct Object Reference (IDOR) vulnerabilities.**
>
> ❌ **Forbidden**:
> ```typescript
> // NEVER accept user_id from the client!
> export const ItemDTOSchema = z.object({
>   title: z.string(),
>   user_id: z.number(), // CRITICAL VULNERABILITY: Attacker can spoof ownership!
> });
> ```
>
> ✅ **Mandatory**:
> ```typescript
> // Strip user_id from client input DTO:
> export const ItemDTOSchema = ItemSchema.omit({ id: true, user_id: true });
> ```

Always inject `user_id` server-side via `createValidator`:
```typescript
const add = createValidator(
  { body: ItemDTOSchema },
  { inject: (req) => ({ user_id: req.me.id }) }, // Authenticated session identity
);
```

> [!IMPORTANT]
> Consult [trusted-injections.md](./references/trusted-injections.md) for full details on DTO `.omit()` schemas and payload enrichment.

---

## 2. The Authentication Wall Pattern

Organize router files (`*Routes.ts`) with an explicit visual boundary between public and protected routes:

```typescript
import { Router } from "express";
import authActions from "../auth/authActions";
import itemActions from "./itemActions";
import itemParamConverter from "./itemParamConverter";
import itemValidators from "./itemValidators";

const router = Router();
const BASE_PATH = "/api/items";
const ITEM_PATH = "/api/items/:itemId";

// 1. Resolve :itemId into req.item on all matching routes
router.param("itemId", itemParamConverter.convert);

// 2. Public Read Endpoints (No authentication needed)
router.get(BASE_PATH, itemActions.browse);
router.get(ITEM_PATH, itemActions.read);

// ────────────────────── AUTHENTICATION WALL ──────────────────────
// Everything below this line strictly requires a valid session cookie:
router.use(BASE_PATH, authActions.verifyAccessToken);

// 3. Authenticated Create (Any logged-in user)
router.post(BASE_PATH, itemValidators.add, itemActions.add);

// 4. Authenticated & Authorized Mutations (Owner only)
router
  .route(ITEM_PATH)
  .all(checkAccess)
  .put(itemValidators.edit, itemActions.edit)
  .delete(itemActions.destroy);

export default router;
```

---

## 3. Ownership Verification (`checkAccess`)

Define ownership middleware directly in the router file to keep security rules auditable and local to the resource:

```typescript
import type { RequestHandler } from "express";

const checkAccess: RequestHandler = (req, res, next) => {
  // req.item is injected by ParamConverter
  // req.me is injected by verifyAccessToken
  if (req.item.user_id === req.me.id) {
    return next();
  }
  res.sendStatus(403); // Forbidden
};
```

> [!IMPORTANT]
> Consult [ownership-and-rbac.md](./references/ownership-and-rbac.md) for role-based access control (RBAC), admin overrides, and fail-fast middleware ordering.

---

## 4. Accessing User Identity

### Server-side: `req.me`
After passing through `authActions.verifyAccessToken`:
- `req.me` is populated with the complete `User` record fetched freshly from the database (`userRepository.find(sub)`).
- If the user was deleted from SQLite, the token is rejected immediately, even if unexpired.
- TypeScript types for `req.me` are globally augmented.

### Client-side: `useMe()` Hook
In React components:
```tsx
import { useMe } from "../auth/MeContext";

function UserProfile() {
  const { user, isAuthenticated, logout } = useMe();

  if (!isAuthenticated || !user) {
    return <p>Please log in.</p>;
  }

  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      <button type="button" onClick={logout}>Sign Out</button>
    </div>
  );
}
```
