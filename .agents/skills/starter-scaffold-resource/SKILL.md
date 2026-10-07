---
name: starter-scaffold-resource
description: >-
  Use this skill when the user asks to create, scaffold, or add a new resource,
  entity, module, CRUD feature, or API endpoint to the StartER framework (e.g., adding
  posts, comments, products, categories). Guides cloning, schema design, repository
  patterns, validation, routing, React integration, and contract tests.
---

# Scaffold a Resource in StartER

This runbook guides the complete end-to-end process of adding a new domain resource to the StartER framework. Always follow the steps in this sequence to maintain architectural consistency, strict typing, and full test coverage.

---

## 13-Step Workflow

### Step 1: Design the Database Schema

Edit `src/database/schema.sql` to declare the table:

```sql
create table if not exists <name> (
  id integer primary key not null,
  title text not null,
  user_id integer not null,
  created_at datetime default (strftime('%Y-%m-%dT%H:%M:%SZ')),
  updated_at datetime default (strftime('%Y-%m-%dT%H:%M:%SZ')),
  deleted_at datetime default null,
  foreign key (user_id) references user(id) on delete cascade
);
```

**Rules**:
- Primary key is always `id integer primary key not null`.
- Always include `created_at`, `updated_at`, and `deleted_at datetime default null` (for soft deletion).
- Table-level foreign keys must use `foreign key (col) references parent(id) on delete cascade`.

---

### Step 2: Add Development Seed Data

Edit `src/database/seeder.sql` to add initial seed rows for local development:

```sql
insert into <name> (id, title, user_id) values
  (1, 'First Demo <Name>', 1),
  (2, 'Second Demo <Name>', 2);
```

---

### Step 3: Reset the Database

Run the reset script to apply the schema and seeder to your SQLite database:

```bash
npm run database:reset -- -n
```

---

### Step 4: Clone the Express Module

Use `make:clone` to duplicate an existing module into `src/express/modules/<name>`.
Prefer `item` as the default source, or choose a closer existing domain module:

```bash
npm run make:clone -- src/express/modules/<source> src/express/modules/<name> <Source> <Name>
```

*Example:*
```bash
npm run make:clone -- src/express/modules/item src/express/modules/post Item Post
```

This clones and renames all files:
- `<name>Actions.ts` (controllers)
- `<name>ParamConverter.ts` (URL parameter resolver & request augmentation)
- `<name>Repository.ts` (SQL persistence)
- `<name>Routes.ts` (Express router)
- `<name>Schemas.ts` (Zod schemas & inferred types)
- `<name>Validators.ts` (validation middleware)

---

### Step 5: Adjust Zod Schemas

Update `src/express/modules/<name>/<name>Schemas.ts` to match your SQL columns:

```typescript
import { z } from "zod";

export const <Name>Schema = z.object({
  id: z.number(),
  title: z.string().max(255),
  user_id: z.number(),
});

export type <Name> = z.infer<typeof <Name>Schema>;

export const <Name>DTOSchema = <Name>Schema.omit({
  id: true,
  user_id: true,
});

export type <Name>DTO = z.infer<typeof <Name>DTOSchema>;

export type <Name>DTOWithUserId = <Name>DTO & {
  user_id: User["id"];
};
```

---

### Step 6: Refactor Repository Queries

Update `src/express/modules/<name>/<name>Repository.ts` to reflect the table name and columns.

> [!IMPORTANT]
> Consult [sql-patterns.md](./references/sql-patterns.md) for detailed patterns.
>
> - **Strict Zod Parsing**: Never use type assertions (`as <Name>`). Always parse raw rows with `<Name>Schema.parse(row)` or `rows.map((row) => <Name>Schema.parse(row))`.
> - **Insert Return**: Use `Number(result.lastInsertRowid)`. SQLite does not use `RETURNING`.
> - **Placeholders**: Always use `?` positional parameters.

---

### Step 7: Verify ParamConverter & Type Augmentation

Inspect `src/express/modules/<name>/<name>ParamConverter.ts`. Ensure:
1. `declare global { namespace Express { interface Request { <name>: <Name>; } } }` augments `req.<name>`.
2. `createParamConverter` correctly calls `<name>Repository.find(id)`.

---

### Step 8: Configure Validation Middleware

Inspect `src/express/modules/<name>/<name>Validators.ts`:
- Configure `createValidator(<Name>DTOSchema, { inject: { user_id: "token.sub" } })` for protected mutations to inject the authenticated user's ID into the validated payload.

---

### Step 9: Register Ambient Types

Open `src/types/index.d.ts` and add ambient type re-exports so entity types are globally accessible across both frontend and backend:

```typescript
type <Name> = import("../express/modules/<name>/<name>Schemas").<Name>;
type <Name>DTO = import("../express/modules/<name>/<nameSchemas").<Name>DTO;
```

---

### Step 10: Mount Express Routes

Open `src/express/routes.ts` and register the new module's router:

```typescript
import <name>Routes from "./modules/<name>/<name>Routes";

// ...
router.use(<name>Routes);
```

---

### Step 11: Clone & Mount React Components

1. Clone the React component tree:
   ```bash
   npm run make:clone -- src/react/components/<source> src/react/components/<name> <Source> <Name>
   ```

2. Register the frontend routes in `src/react/routes.tsx`:
   ```tsx
   import { <name>Routes } from "./components/<name>/index";

   // Inside the authenticated / main children array:
   const routes: RouteObject[] = [
     {
       /* ... */
       children: [
         /* ... */
         ...<name>Routes,
       ],
     },
   ];
   ```

---

### Step 12: Define Fixtures and API Contracts

> [!IMPORTANT]
> Consult [contract-structure.md](./references/contract-structure.md) for full contract examples.

1. **Create Fixtures** (`tests/fixtures/<name>.ts`):
   - Define frozen test records (`first<Name>`, `second<Name>`, `all<Name>s`).
   - Export `seed<Name>s(db: DatabaseSync)`.
2. **Register Fixture** (`tests/fixtures/index.ts`):
   - Add `seed<Name>s` to `seeders` array in parent-child foreign key order.
   - Export all fixtures from the index.
3. **Create Contract** (`tests/contracts/<name>.ts`):
   - Declare test cases for `browse`, `read`, `create`, `edit`, and `delete`.
4. **Register Contract** (`tests/contracts/index.ts`):
   - Mount `<name>: <name>Contract` in the default export.

---

### Step 13: Verify Integrity

Run the verification test suite to ensure type safety, formatting, and contract conformance:

```bash
npm run types:check && npm run biome:check && npm test
```
