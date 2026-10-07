# Node:SQLite Persistence & CRUD Patterns

This reference documents the standard database access patterns for StartER repositories.

## Overview

Repositories in StartER encapsulate all persistence logic using the built-in `node:sqlite` driver.
- Repository files live in `src/express/modules/<name>/<name>Repository.ts`.
- The database connection is imported from `src/database/index.ts`:
  ```typescript
  import database from "../../../database";
  ```

---

## The 4 Core Operations

### 1. Read Single Record (`find`)

```typescript
find(id: Item["id"]): Item | null {
  const row = database
    .prepare(
      "select id, title, user_id from item where id = ? and deleted_at is null",
    )
    .get(id);

  return row ? ItemSchema.parse(row) : null;
}
```

- Use `.get(...params)` — returns a single row object or `undefined`.
- Return `null` when not found (do not throw; upper layers handle 404/204 semantics).

### 2. Read Collection (`findAll`)

```typescript
findAll(limit: number, offset: number): Item[] {
  const rows = database
    .prepare(
      "select id, title, user_id from item where deleted_at is null limit ? offset ?",
    )
    .all(limit, offset);

  return rows.map((row) => ItemSchema.parse(row));
}
```

- Use `.all(...params)` — returns an array of objects.
- Always apply pagination parameters (`limit`, `offset`) and filter by `deleted_at is null`.

### 3. Insert Record (`create`)

```typescript
create(item: ItemDTOWithUserId): Item["id"] {
  const result = database
    .prepare("insert into item (title, user_id) values (?, ?)")
    .run(item.title, item.user_id);

  return Number(result.lastInsertRowid);
}
```

- Use `.run(...params)` — returns `{ lastInsertRowid, changes }`.
- In SQLite / `node:sqlite`, do **not** use `RETURNING id`. Retrieve the new identifier from `Number(result.lastInsertRowid)`.

### 4. Update & Delete (`update`, `softDelete`, `hardDelete`)

```typescript
update(item: Item): boolean {
  const result = database
    .prepare(
      "update item set title = ?, user_id = ? where id = ? and deleted_at is null",
    )
    .run(item.title, item.user_id, item.id);

  return result.changes > 0;
}

softDelete(id: Item["id"]): boolean {
  const result = database
    .prepare("update item set deleted_at = datetime('now') where id = ?")
    .run(id);

  return result.changes > 0;
}

softUndelete(id: Item["id"]): boolean {
  const result = database
    .prepare("update item set deleted_at = null where id = ?")
    .run(id);

  return result.changes > 0;
}

hardDelete(id: Item["id"]): boolean {
  const result = database.prepare("delete from item where id = ?").run(id);

  return result.changes > 0;
}
```

- Use `result.changes > 0` to indicate whether an existing row was affected.

---

## Strict Rules

### 1. Zod Runtime Parsing (NO Type Assertions)

> [!CAUTION]
> **Never use TypeScript type assertions on database query results.**
>
> ❌ **Forbidden**:
> ```typescript
> const item = row as Item; // FORBIDDEN: bypasses runtime validation
> const items = rows as Item[]; // FORBIDDEN
> ```
>
> ✅ **Mandatory**:
> ```typescript
> return row ? ItemSchema.parse(row) : null;
> return rows.map((row) => ItemSchema.parse(row));
> ```

SQLite returns untyped plain JavaScript objects. Using `Schema.parse(row)` guarantees:
- Runtime schema validation at the database boundary
- Automatic type coercion if needed
- Immediate detection of schema mismatches or corrupted data

### 2. Positional Placeholders (`?`) Only

> [!IMPORTANT]
> Never concatenate or interpolate parameters into SQL queries:
> - ❌ `database.prepare(\`select * from item where id = ${id}\`)`
> - ✅ `database.prepare("select * from item where id = ?").get(id)`

### 3. Soft Delete Semantics

- Every entity table includes `deleted_at text default null`.
- `find` and `findAll` queries must explicitly filter: `where deleted_at is null`.
- `softDelete` sets `deleted_at = datetime('now')`.
- `softUndelete` resets `deleted_at = null`.
- `hardDelete` is available for maintenance or test cleanup.
