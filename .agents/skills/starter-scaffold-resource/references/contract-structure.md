# Declarative Contract Testing Reference

This reference documents the structure for API contracts and test fixtures in StartER.

## Architecture

StartER validates HTTP API endpoints through declarative contracts executed against an in-memory SQLite database populated with deterministic fixtures.

Testing a resource involves two parts:
1. **Fixtures**: `tests/fixtures/<name>.ts` + registration in `tests/fixtures/index.ts`
2. **Contract**: `tests/contracts/<name>.ts` + registration in `tests/contracts/index.ts`

---

## 1. Fixture Pattern (`tests/fixtures/<name>.ts`)

Fixtures define immutable mock objects and a seeder function:

```typescript
import type { DatabaseSync } from "node:sqlite";
import { standardUser, userWithAvatar } from "./users";

export const firstItem: Item = Object.freeze({
  id: 1,
  title: "Stuff",
  user_id: standardUser.id,
});

export const secondItem: Item = Object.freeze({
  id: 2,
  title: "Doodads",
  user_id: userWithAvatar.id,
});

export const allItems: Item[] = Object.freeze([
  firstItem,
  secondItem,
]) as Item[];

export const seedItems = (db: DatabaseSync) => {
  const insertItem = db.prepare(
    "insert into item(id, title, user_id) values(?, ?, ?)",
  );
  for (const item of allItems) {
    insertItem.run(item.id, item.title, item.user_id);
  }
};
```

### Seeder Registration & Dependency Ordering (`tests/fixtures/index.ts`)

Foreign key constraints require seeders to execute in parent-to-child order:

```typescript
import { seedAuthTokens } from "./auth";
import { seedItems } from "./items";
import { seedUsers } from "./users";
import { seedPosts } from "./posts"; // child of users

export const seeders: readonly Seeder[] = Object.freeze([
  seedUsers,      // 1. Independent parent
  seedItems,      // 2. References user
  seedPosts,      // 3. References user
  seedAuthTokens, // 4. References user
]);

export * from "./posts";
```

---

## 2. Declarative Contract Pattern (`tests/contracts/<name>.ts`)

Every endpoint is tested across standard BDD-style cases:

```typescript
import { allItems, firstItem } from "../fixtures/items";
import { standardUser, userWithAvatar } from "../fixtures/users";

export default (<Contract>{
  browse: {
    method: "get",
    path: "/api/items",
    cases: {
      success: {
        request: { headers: { Range: "items=0-9" } },
        response: {
          status: 206,
          body: allItems,
          headers: {
            "content-range": `items 0-${allItems.length - 1}/${allItems.length}`,
          },
        },
      },
      no_range: {
        request: {},
        response: { status: 400, body: {} },
      },
    },
  },
  create: {
    method: "post",
    path: "/api/items",
    cases: {
      success: {
        request: {
          body: { title: "New Item" },
          jwtPayload: { sub: standardUser.id },
        },
        response: { status: 201, body: { insertId: expect.any(Number) } },
      },
      bad_request: {
        request: { body: {}, jwtPayload: { sub: standardUser.id } },
        response: { status: 400, body: expect.any(Array) },
      },
      unauthorized: {
        request: { body: { title: "New Item" }, jwtPayload: null },
        response: { status: 401, body: {} },
      },
    },
  },
  read: {
    method: "get",
    path: `/api/items/${firstItem.id}`,
    cases: {
      success: {
        request: {},
        response: { status: 200, body: firstItem },
      },
      not_found: {
        specialPath: `/api/items/${NaN}`,
        request: {},
        response: { status: 404, body: {} },
      },
    },
  },
  edit: {
    method: "put",
    path: `/api/items/${firstItem.id}`,
    cases: {
      success: {
        request: {
          body: { title: "Updated Item" },
          jwtPayload: { sub: firstItem.user_id },
        },
        response: { status: 204, body: {} },
      },
      forbidden: {
        request: {
          body: { title: "Updated Item" },
          jwtPayload: { sub: userWithAvatar.id }, // Not the owner
        },
        response: { status: 403, body: {} },
      },
    },
  },
  delete: {
    method: "delete",
    path: `/api/items/${firstItem.id}`,
    cases: {
      success: {
        request: { jwtPayload: { sub: standardUser.id } },
        response: { status: 204, body: {} },
      },
      unauthorized: {
        request: { jwtPayload: null },
        response: { status: 401, body: {} },
      },
      forbidden: {
        request: { jwtPayload: { sub: userWithAvatar.id } },
        response: { status: 403, body: {} },
      },
    },
  },
});
```

### Register Contract (`tests/contracts/index.ts`)

```typescript
import postsContract from "./posts";

export default {
  // ...
  posts: postsContract,
};
```

---

## Running Contract Tests

```bash
npx vitest run tests/contracts
```
