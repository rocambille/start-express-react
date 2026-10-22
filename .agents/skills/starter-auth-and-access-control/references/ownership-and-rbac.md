# Ownership & Role-Based Access Control (RBAC)

This reference documents how to enforce resource ownership and role-based permissions in StartER routers.

---

## 1. Ownership Verification (`checkAccess`)

In StartER, resource ownership logic is declared **directly in the resource's routes file** (`*Routes.ts`). This ensures authorization rules are obvious, auditable, and fail-fast.

```typescript
import type { RequestHandler } from "express";

/*
  Ownership check:
  - Assumes req.item was injected by ParamConverter
  - Assumes req.me was injected by verifyAccessToken
*/
const checkAccess: RequestHandler = (req, res, next) => {
  if (req.item.user_id === req.me.id) {
    return next(); // User is the owner, allow request
  }
  res.sendStatus(403); // Forbidden
};
```

---

## 2. Router Composition with `.all()`

Apply ownership checks cleanly across multiple HTTP methods on a path using `router.route().all()`:

```typescript
// Routes for /api/items/:itemId
router
  .route(ITEM_PATH)
  .all(checkAccess) // Enforces ownership on ALL handlers below
  .put(itemValidators.edit, itemActions.edit)
  .delete(itemActions.destroy);
```

### Why `.all(checkAccess)`:
- Guarantees neither `PUT` nor `DELETE` can execute without ownership verification.
- Rejects unauthorized users before validation middleware (`itemValidators.edit`) runs.
- Eliminates repetitive `if (item.user_id !== req.me.id)` conditionals inside controller actions.

---

## 3. Role-Based Access Control (RBAC)

When an application supports administrator roles or elevated permissions, combine ownership checks with role evaluation:

```typescript
const checkAccessOrAdmin: RequestHandler = (req, res, next) => {
  const isOwner = req.item.user_id === req.me.id;
  const isAdmin = req.me.role === "admin";

  if (isOwner || isAdmin) {
    return next();
  }

  res.sendStatus(403);
};
```

### Dedicated Admin-Only Guards
For endpoints restricted exclusively to staff or administrators:

```typescript
const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.me.role === "admin") {
    return next();
  }
  res.sendStatus(403);
};

router.delete("/api/admin/purge", requireAdmin, adminActions.purge);
```

---

## 4. The Authentication Wall Pattern

Group public and protected routes around an explicit boundary:

```typescript
const BASE_PATH = "/api/posts";
const POST_PATH = "/api/posts/:postId";

// 1. Resolve :postId parameter on all matching routes
router.param("postId", postParamConverter.convert);

// 2. Public Read Endpoints (No auth needed)
router.get(BASE_PATH, postActions.browse);
router.get(POST_PATH, postActions.read);

// ────────────────────── AUTHENTICATION WALL ──────────────────────
// Everything below this line strictly requires an active user session:
router.use(BASE_PATH, authActions.verifyAccessToken);

// 3. Authenticated Create (Any logged-in user)
router.post(BASE_PATH, postValidators.add, postActions.add);

// 4. Authenticated & Authorized Mutations (Owner only)
router
  .route(POST_PATH)
  .all(checkAccess)
  .put(postValidators.edit, postActions.edit)
  .delete(postActions.destroy);
```

### Benefits of the Wall:
- **Zero Duplication**: `verifyAccessToken` is applied once to `BASE_PATH`, protecting all subsequent routes automatically.
- **Fail-Fast**: Anonymous users receive a `401 Unauthorized` before any validator or action executes.
- **Clear Security Audit**: Developers can instantly verify which routes are public vs protected simply by reading the router from top to bottom.
