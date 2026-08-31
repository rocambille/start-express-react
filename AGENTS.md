# AGENTS.md — StartER (start-express-react)

> AI agent briefing for this codebase. Read this before writing or modifying any code.
> Human-readable docs live in the [wiki](https://github.com/rocambille/start-express-react/wiki).

---

## Stack

- **Backend**: Node.js + Express 5, TypeScript, Zod (validation), `node:sqlite` (sync API)
- **Frontend**: React 19, React Router (with SSR/hydration), Vite, Pico CSS
- **Database**: SQLite — zero-config, synchronous, file at `data/sqlite/database.sqlite`
- **Tooling**: Biome (lint + format), Vitest (tests), tsx (runtime), Docker (optional)

---

## Directory structure

```
.
├── server.ts                  # Single entry point — bridges Express + Vite
├── index.html                 # Vite root — contains <!--ssr-outlet-->
├── data/
│   ├── mailpit/               # Mailpit persistence (Docker)
│   └── sqlite/
│       └── database.sqlite    # Generated locally — NOT committed to git
├── src/
│   ├── entry-client.tsx       # Client-side hydration (hydrateRoot)
│   ├── entry-server.tsx       # SSR rendering (renderToPipeableStream)
│   ├── env/                   # Environment schemas & validation
│   │   ├── client.ts          # Client-side environment variables from import.meta.env
│   │   └── server.ts          # Server-side environment variables from process.env
│   ├── database/
│   │   ├── schema.sql         # SQLite schema — source of truth for DB structure
│   │   ├── migrations/        # Forward-only migration scripts (production)
│   │   └── seeder.sql         # Test/seed data
│   ├── express/
│   │   ├── routes.ts          # Registers all Express modules
│   │   ├── helpers/           # Infrastructure: cache, validation, converters
│   │   └── modules/           # Business modules (item/, user/, auth/, ...)
│   │       └── <name>/
│   │           ├── <name>Routes.ts            # Route declarations
│   │           ├── <name>Actions.ts           # Request handlers (thin, delegate to repo)
│   │           ├── <name>ParamConverter.ts    # Converts URL params to entity-typed objects
│   │           ├── <name>Repository.ts        # All SQL queries for this entity
│   │           ├── <name>Schemas.ts           # Single Source of Truth Zod schemas & types (ItemSchema, ItemDTOSchema)
│   │           └── <name>Validators.ts        # Express validation middleware handlers ({ add, edit })
│   ├── react/
│   │   ├── routes.tsx         # React Router route tree
│   │   ├── helpers/           # Hooks, mutations, fetch utilities
│   │   └── components/        # UI components and pages
│   └── types/
│       └── index.d.ts         # Shared ambient TypeScript types (Item, User) re-exported from schemas
├── tests/
│   └── contracts              # API contract definitions — declarative source of truth
└── biome.json                 # Lint + format config
```

---

## Common commands

### Development

```bash
npm install
cp .env.sample .env
npm run database:reset      # Drop all, replay schema + migrations + seeder
npm run dev                # Start dev server (Express + Vite together on port 5173)
```

### Database

```bash
npm run database:reset                # Drop all, replay schema + migrations + seeder
npm run database:reset -- -n          # Non-interactive (CI/CD — skips confirmation prompt)
npm run database:migrate              # Apply un-applied migrations (production)
npm run database:migrate -- -n        # Non-interactive (CI/CD)
```

> SQLite requires NO Docker, NO connection string, NO async setup. The DB file is created on the fly.

### Code quality (run before every commit)

```bash
npm run types:check     # TypeScript strict check (tsc --noEmit)
npm run biome:check     # Lint + format check
npm run biome:fix       # Auto-fix formatting
npx vitest run --exclude tests/install   # Run all tests except install checks
```

> The pre-commit hook runs `types:check`, `biome:check`, and Vitest automatically.

### Creating new modules (pattern cloning — preferred over writing from scratch)

```bash
# Clone an existing module, replacing all name references
npm run make:clone -- <source_dir> <dest_dir> <OldName> <NewName>

# Example: create a "post" module from "item"
npm run make:clone -- src/express/modules/item src/express/modules/post Item Post
```

After cloning an express module, register the new routes in src/express/routes.ts:

```typescript
import postRoutes from "./modules/post/postRoutes";

router.use(postRoutes);
```

After cloning a react module, register the new routes in src/react/routes.tsx:

```tsx
import { postRoutes } from "./components/post/index";

/* ... */

const routes: RouteObject[] = [
  {
    /* ... */
    children: [
      /* ... */
      ...postRoutes,
    ],
  },
];
```

> Always prefer `make:clone` over writing modules from scratch. It replicates your actual patterns.

### Cleanup

```bash
npm run make:purge                       # Remove example modules (item, post, auth, user)
npm run make:purge -- --keep-auth        # Remove items but keep auth and user
npm run install:check                    # Verify .env and database file are accessible
```

### Production

```bash
docker compose -f compose.prod.yaml up --build   # Build + start prod containers
# Prod sets NODE_ENV=production, runs: npm run build && npm start
```

---

## Architecture — key decisions

### One server (not two)

There is **one** Node process serving both the Express API and the React frontend via SSR. `server.ts` is the single entry point. Vite runs in middleware mode embedded inside Express — there is no separate Vite dev server to proxy.

- API routes (`/api/*`) are handled by Express.
- All other routes fall through to the SSR catch-all, which calls `entry-server.tsx`.
- The client then hydrates via `entry-client.tsx`.

Do not add a second server, a proxy config, or separate ports.

### Repository pattern — all SQL goes through repositories

Every database interaction must live inside a `*Repository.ts` class. Actions must never contain raw SQL.

```ts
// ✅ Correct — action delegates to repository
const browse: RequestHandler = (req, res) => {
  const items = itemRepository.findAll(10, 0);
  res.json(items);
};

// ❌ Wrong — SQL in an action
const browse: RequestHandler = (req, res) => {
  const rows = database.prepare("select * from item").all();
  res.json(rows);
};
```

### Zod Output Parsing & Single Source of Truth (`*Schemas.ts`)

Zod schemas are centralized per module in `*Schemas.ts` as a Single Source of Truth (SSOT). SQLite returns raw SQL primitives (`string | number | bigint | null`). Always reconstruct entity objects in repositories by parsing them through the master entity schema (`ItemSchema`, `UserSchema`).

Input DTO schemas (e.g. `ItemDTOSchema`) are derived from the master entity schema using `.omit()` to enforce DRY validation rules across boundaries.

```ts
// In src/express/modules/item/itemSchemas.ts
export const ItemSchema = z.object({
  id: z.number(),
  title: z.string().max(255),
  user_id: z.number(),
});

export const ItemDTOSchema = ItemSchema.omit({ id: true, user_id: true });

// In src/express/modules/item/itemRepository.ts
import { ItemSchema } from "./itemSchemas";

// ✅ Correct — validates SQL raw row against schema
return ItemSchema.parse(row);

// ❌ Wrong — hides runtime SQL errors
return row as Item;
```

### Synchronous SQLite — no async/await for database calls

`node:sqlite` is synchronous by design. Repository methods must execute SQL queries synchronously and must not wrap database calls in `async`/`await`. 

However, a repository method *may* be marked `async` if it strictly requires interaction with genuinely asynchronous external resources (e.g., third-party APIs, asynchronous file system reads). Actions (in `*Actions.ts`) generally remain `async` to handle `req.body` and orchestrate these calls.

```ts
// ✅ Correct SQLite query
find(id: number): Item | null {
  const query = database.prepare("select id, title from item where id = ?");
  const row = query.get(id);
  // ...
}

// ✅ Correct (Mixed resource query)
async fetchAndSave(id: number): Promise<Item> {
  const data = await fetch(`https://api.example.com/data/${id}`);
  database.prepare("insert into item (title) values (?)").run(data.title);
}

// ❌ Wrong (Wrapping SQLite in async for no reason)
async find(id: number): Promise<Item | null> { ... }
```

### Soft delete by default

The `destroy` action uses `softDelete` (sets `deleted_at = datetime('now')`), not `hardDelete`. All read queries filter with `WHERE deleted_at IS NULL`. Do not bypass this without explicit intent.

### Validation at the edge with Zod

Input validation belongs in a `*Validators.ts` file using `createValidator` and DTO schemas from `*Schemas.ts`, registered as middleware before actions in `*Routes.ts`. Validators merge client DTO input with trusted server-side injections (`inject: (req) => ({ user_id: req.me.id })`), so actions receive complete, trusted payloads (`req.body`).

```ts
// In itemValidators.ts
const add = createValidator(
  { body: ItemDTOSchema },
  { inject: (req) => ({ user_id: req.me.id }) }
);

// In itemRoutes.ts
router.post(BASE_PATH, itemValidators.add, itemActions.add);
```

### Pagination

Repository `findAll` methods take `(limit: number, offset: number)` arguments. Actions derive `offset` (`start`) and `limit` (`end - start + 1`) from the HTTP `Range: <unit>=start-end` header, returning `206 Partial Content` with `Content-Range: <unit> start-end/total`. Never query a table without a LIMIT.

### API contract tests

`tests/contracts/` is the declarative source of truth for API behavior. When adding or modifying endpoints, update the contract file first, then implement to satisfy it.

---

## Security — do not break these

### CSRF (Client-Side Double-Submit pattern)

All mutative requests (POST, PUT, PATCH, DELETE) require:
- A header `X-CSRF-Token: <token>`
- A cookie `__Host-x-csrf-token=<same-token>`

The server checks that both values match. The API is stateless — no server-side session storage.

When testing mutative endpoints with Postman/Insomnia/curl, provide matching values in both the header and the cookie:
```
Header:  X-CSRF-Token: test-token
Cookie:  __Host-x-csrf-token=test-token
```

### Cookies

Both auth cookies use the `__Host-` prefix, `SameSite=strict`, and `Path=/`. Do not remove these attributes. The auth cookie (`__Host-auth`) is `HttpOnly`. The CSRF cookie is not (it is written client-side).

### Helmet and CSP

Helmet is enabled in all environments. `contentSecurityPolicy` is **disabled in development** (Vite WebSockets conflict) and **enabled in production**. Do not disable Helmet.

### No CORS

There is no CORS configuration. Cross-site requests are intentionally blocked. The frontend and API share the same origin. Do not add CORS middleware unless explicitly required by a new requirement.

### No dangerouslySetInnerHTML

Do not use `dangerouslySetInnerHTML` anywhere. React's default escaping is the XSS protection. This is not negotiable.

### Error responses

Backend errors must be concise: `400`, `401`, `403`, `404`, `500`. Never expose internal details (stack traces, SQL errors, token specifics) in HTTP responses.

### File uploads

StartER has no file upload handling. If adding one, store files outside the document root, validate MIME type and size, and never serve them with an executable Content-Type.

### Environment variables

Environment variables are defined and validated in `src/env/client.ts` (client) and `src/env/server.ts` (server). Import `{ serverEnv }` from `env/server` (if you are in server code) or `{ clientEnv }` from `env/client` (if you are in frontend code).

- `APP_SECRET`: Secret key for JWT signing. Generate with `openssl rand -hex 32`.
- `SMTP_URL`: Optional in development (magic links print to console); required in production.
- `DKIM_PRIVATE_KEY`: Optional path to private key file or inline PEM string for DKIM signing.
- `DKIM_DOMAIN` / `DKIM_SELECTOR`: Optional domain and selector overrides (auto-derived from SMTP_URL hostname and `"mail"` if omitted).

Never commit `.env`. Never commit `data/sqlite/database.sqlite`. Both are in `.gitignore`.

---

## Terminology

| Term | What it means in this codebase |
|---|---|
| **Module** | A self-contained Express feature folder: `*Routes.ts`, `*Actions.ts`, `*Repository.ts`, `*Schemas.ts`, `*Validators.ts` |
| **Action** | An Express `RequestHandler` — thin, delegates to repository, sends HTTP response |
| **Repository** | Class encapsulating all SQL for one table — the only place raw SQL is allowed |
| **Schema** | Centralized Zod schema in `*Schemas.ts` defining master entity and derived input DTO shapes |
| **Validator** | Express middleware in `*Validators.ts` created via `createValidator` to validate request targets |
| **Contract** | A test declaration in `tests/contracts/` describing expected API behavior |
| **SSR outlet** | The `<!--ssr-outlet-->` placeholder in `index.html` where server-rendered HTML is injected |
| **Hydration** | Client-side React taking over the server-rendered DOM via `hydrateRoot` in `entry-client.tsx` |
| **Soft delete** | Setting `deleted_at` timestamp instead of removing a row — default delete strategy |
| **Hard delete** | Permanently removing a row — use only when explicitly required |
| **`make:clone`** | CLI script to duplicate a module with automatic name replacement |
