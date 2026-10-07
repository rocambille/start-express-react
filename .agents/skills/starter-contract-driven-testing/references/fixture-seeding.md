# Fixture Seeding & In-Memory Database Lifecycle

This reference documents the test database lifecycle, fixture factory patterns, and foreign key ordering rules in StartER.

---

## The In-Memory SQLite Test Lifecycle

Contract tests execute against an isolated in-memory SQLite database (`:memory:`) to guarantee test speed and zero state leakage between tests.

In `tests/express/test-utils.ts`:
1. `database` is mocked with a new in-memory instance:
   ```typescript
   vi.mock("../../src/database", () => ({
     default: new DatabaseSync(":memory:"),
   }));
   ```
2. Before **each** test case (`beforeEach` → `setupMocks()`):
   - Foreign key checks are temporarily disabled (`PRAGMA foreign_keys = OFF`).
   - All existing tables are dropped.
   - Foreign key checks are re-enabled (`PRAGMA foreign_keys = ON`).
   - `src/database/schema.sql` and all migrations from `src/database/migrations/` are applied.
   - All seeder functions in `seeders` are executed sequentially.
3. Every contract test case starts with an identical, pristine database state.

---

## Defining Fixtures (`tests/fixtures/<name>.ts`)

Fixtures provide immutable, typed test records used across both backend contract tests and frontend component tests:

```typescript
import type { DatabaseSync } from "node:sqlite";
import { standardUser, userWithAvatar } from "./users";

// 1. Frozen individual entity mocks
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

// 2. Frozen collection mock
export const allItems: Item[] = Object.freeze([
  firstItem,
  secondItem,
]) as Item[];

// 3. Seeder function for SQLite population
export const seedItems = (db: DatabaseSync) => {
  const insertItem = db.prepare(
    "insert into item(id, title, user_id) values(?, ?, ?)",
  );
  for (const item of allItems) {
    insertItem.run(item.id, item.title, item.user_id);
  }
};
```

### Best Practices for Fixtures:
- **`Object.freeze()`**: Ensures tests cannot accidentally mutate shared fixture objects during test execution.
- **Explicit Primary Keys**: Assign explicit IDs (`1`, `2`) so contract endpoints can reference known IDs deterministically.
- **Relate via Parents**: Reference parent fixture IDs directly (e.g. `user_id: standardUser.id`) to avoid foreign key violations.

---

## Topological Ordering in `tests/fixtures/index.ts`

Because SQLite strictly enforces foreign key constraints (`PRAGMA foreign_keys = ON`), seeder functions must run in **topological dependency order**: parent tables first, child tables after.

```typescript
import type { DatabaseSync } from "node:sqlite";
import { seedAuthTokens } from "./auth";
import { seedItems } from "./items";
import { seedUsers } from "./users";
import { seedPosts } from "./posts";

export type Seeder = (db: DatabaseSync) => void;

// 1. Users must be seeded BEFORE tables referencing user(id)
// 2. Child tables (items, posts) seed next
// 3. Dependent cross-reference tokens seed last
export const seeders: readonly Seeder[] = Object.freeze([
  seedUsers,      // Parent (no foreign keys)
  seedItems,      // References user(id)
  seedPosts,      // References user(id)
  seedAuthTokens, // References user(id)
]);

// Re-export all fixture constants for easy imports across tests
export * from "./auth";
export * from "./items";
export * from "./posts";
export * from "./users";
```

> [!CAUTION]
> If a child seeder runs before its parent, the test setup will throw a `FOREIGN KEY constraint failed` error during `setupMocks()`. Always verify the ordering in `seeders`.
