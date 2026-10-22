---
name: starter-contract-driven-testing
description: >-
  Use this skill when authoring, modifying, or debugging API endpoint contracts and
  test fixtures in StartER (tests/contracts/ and tests/fixtures/). Explains declarative
  contract definitions, fixture factories, topological FK ordering, running contracts
  via Vitest, and how contracts automatically mock frontend React component tests.
---

# Declarative Contract-Driven Testing in StartER

In StartER, API integration testing does **not** use imperative Supertest scripts (`supertest(app).post(...)` scattered in separate files). Instead, the framework uses a declarative **Data-Driven Contract Testing Architecture**.

API contracts in `tests/contracts/` serve as the **Single Source of Truth** for two distinct purposes:
1. **Backend Integration Testing**: `tests/express/contracts.test.ts` dynamically runs Vitest test suites for every contract against an isolated in-memory SQLite database.
2. **Frontend Mocking**: `tests/react/test-utils.tsx` reads contracts to automatically mock `globalThis.fetch` in React component tests—guaranteeing 0% drift between backend reality and frontend test mocks.

---

## Contract File Anatomy

Every resource has a declarative contract file in `tests/contracts/<resource>.ts`:

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
          jwtPayload: { sub: standardUser.id }, // Auto-signs JWT for __Host-auth cookie
        },
        response: { status: 201, body: { insertId: expect.any(Number) } },
      },
      unauthorized: {
        request: { body: { title: "New Item" }, jwtPayload: null },
        response: { status: 401, body: {} },
      },
    },
  },
});
```

> [!IMPORTANT]
> Consult [contract-case-syntax.md](./references/contract-case-syntax.md) for full syntax details on `request`, `response`, `attach` (file uploads), `withoutCsrfProtection`, and `specialPath`.

---

## 4-Step Authoring Workflow

Follow this sequence whenever adding or updating API contracts:

### Step 1: Create Fixtures (`tests/fixtures/<name>.ts`)
Define frozen entity records and an exported seeder function:

```typescript
import type { DatabaseSync } from "node:sqlite";
import { standardUser } from "./users";

export const firstPost: Post = Object.freeze({
  id: 1,
  title: "First Post",
  user_id: standardUser.id,
});

export const allPosts: Post[] = Object.freeze([firstPost]) as Post[];

export const seedPosts = (db: DatabaseSync) => {
  const query = db.prepare("insert into post (id, title, user_id) values (?, ?, ?)");
  for (const post of allPosts) {
    query.run(post.id, post.title, post.user_id);
  }
};
```

### Step 2: Register Seeder (`tests/fixtures/index.ts`)
Register the seeder in `seeders` strictly in parent-to-child foreign key order, and re-export the fixtures:

```typescript
import { seedPosts } from "./posts";

export const seeders: readonly Seeder[] = Object.freeze([
  seedUsers,      // 1. Parent
  seedItems,      // 2. Child
  seedPosts,      // 3. Child (depends on users)
  seedAuthTokens, // 4. Dependent tokens
]);

export * from "./posts";
```

> [!CAUTION]
> Consult [fixture-seeding.md](./references/fixture-seeding.md) to ensure correct foreign key topological ordering and avoid `FOREIGN KEY constraint failed` errors.

### Step 3: Declare Contract Cases (`tests/contracts/<name>.ts`)
Declare all test suites (`browse`, `read`, `create`, `edit`, `delete`) with standard cases:
- `success`: Happy path with valid input and permissions.
- `bad_request`: Invalid DTO or validation failure (status 400).
- `unauthorized`: Missing or invalid session (status 401 with `jwtPayload: null`).
- `forbidden`: Resource owned by another user (status 403).
- `not_found`: Non-existent record (status 404, often using `specialPath: /api/.../${NaN}`).

### Step 4: Register Contract in Index (`tests/contracts/index.ts`)
Mount the contract in the default export object:

```typescript
import postsContract from "./posts";

export default {
  auth: authContract,
  health: healthContract,
  items: itemsContract,
  posts: postsContract,
  users: usersContract,
};
```

---

## Executing & Debugging Contracts

### Run All Contract Tests
```bash
npx vitest run tests/express/contracts.test.ts
```

### Isolate a Single Test Case (`only: true`)
When troubleshooting a specific case, add `only: true` to the case definition:

```typescript
cases: {
  success: {
    only: true, // Only this case runs across the entire test suite!
    request: { ... },
    response: { ... },
  },
}
```

Remember to remove `only: true` before committing.

---

## How React Component Tests Consume Contracts

In React component tests (`tests/react/components/...`):
- `setupMocks()` in `tests/react/test-utils.tsx` automatically intercepts `globalThis.fetch` and matches incoming calls against registered contracts.
- **Do not** write custom fetch spies or manual response mocks.
- Use `requestValue()` and `responseValue()` to pull deterministic fixture data directly from contracts:
  ```typescript
  import { expectContractCall, requestValue } from "../../test-utils";

  // Type form value defined in contract:
  await user.type(screen.getByLabelText(/title/i), String(requestValue("items", "create", "success", "title")));

  // Assert component triggered exact contract call:
  expectContractCall("items", "create", "success");
  ```
