# Trusted Injections & Eliminating IDOR Vulnerabilities

This reference documents how StartER uses Zod DTOs and `createValidator` injections to completely neutralize Insecure Direct Object Reference (IDOR) attacks.

---

## The IDOR Threat Model

An Insecure Direct Object Reference (IDOR) occurs when an application relies on client-supplied identity attributes (such as `user_id`, `account_id`, or `author_id`) to associate records with users.

### ❌ The Vulnerable Pattern:
```typescript
// DANGEROUS: Accepts user_id from client JSON payload
export const BadItemDTOSchema = z.object({
  title: z.string(),
  user_id: z.number(), // VULNERABILITY!
});

// An attacker sends:
// POST /api/items
// { "title": "Malicious Item", "user_id": 1 } <-- Hijacks admin identity!
```

If the backend trusts `req.body.user_id`, any authenticated user can create or manipulate records under another user's account.

---

## The StartER Solution: DTO Separation + Server-Side Injection

StartER eliminates IDOR vulnerabilities at the architectural boundary by strictly separating client input from server-enforced identity.

### 1. DTO Schema Omits Sensitive Fields (`*Schemas.ts`)

The input boundary schema derived from the master entity schema **always** strips `id` and `user_id`:

```typescript
export const ItemSchema = z.object({
  id: z.number(),
  title: z.string().max(255),
  user_id: z.number(),
});

// Client Input Boundary: Client can ONLY supply `title`
export const ItemDTOSchema = ItemSchema.omit({
  id: true,
  user_id: true,
});

export type ItemDTO = z.infer<typeof ItemDTOSchema>;

// Downstream Action Contract: Enriched with trusted server data
export type ItemDTOWithUserId = ItemDTO & {
  user_id: User["id"];
};
```

Even if a malicious client sends `{"title": "Test", "user_id": 999}`, Zod's parsing automatically strips or ignores the untrusted `user_id`.

---

### 2. Forceful Server Injection (`*Validators.ts`)

Validation middleware configured via `createValidator` forcefully injects trusted identity attributes extracted from `req.me` (authenticated session) and `req.<entity>` (resolved param converter):

```typescript
import { createValidator } from "../../helpers/validation";
import { ItemDTOSchema } from "./itemSchemas";

// Add Validator (POST /api/items)
const add = createValidator(
  { body: ItemDTOSchema },
  {
    inject: (req) => ({
      user_id: req.me.id, // Strictly from verified session JWT
    }),
  },
);

// Edit Validator (PUT /api/items/:itemId)
const edit = createValidator(
  { body: ItemDTOSchema },
  {
    inject: (req) => ({
      id: req.item.id,    // Strictly from resolved ParamConverter
      user_id: req.me.id, // Strictly from verified session JWT
    }),
  },
);

export default { add, edit };
```

---

### 3. Downstream Controller Safety (`*Actions.ts`)

Because `createValidator` replaces `req.body` with the merged, validated payload:
- Downstream actions receive a clean, 100% trusted `req.body`.
- Actions do not need manual ID reassignment.
- Repositories receive genuine user IDs:
  ```typescript
  const add: RequestHandler = (req, res) => {
    // req.body is typed ItemDTOWithUserId; user_id is guaranteed authentic
    const insertId = itemRepository.create(req.body);
    res.status(201).json({ insertId });
  };
  ```
