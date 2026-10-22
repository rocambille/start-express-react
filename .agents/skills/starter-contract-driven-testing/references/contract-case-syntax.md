# Contract Case Syntax Reference

This reference documents the complete syntax and options available when declaring API contract test cases in `tests/contracts/<name>.ts`.

---

## Contract Schema

Each contract file exports a default object cast to `<Contract>`:

```typescript
export default (<Contract>{
  [testName: string]: {
    method: "get" | "post" | "put" | "delete" | "patch",
    path: string,
    cases: {
      [caseName: string]: TestCase,
    },
  },
});
```

---

## Test Case Properties (`TestCase`)

### 1. `request` Configuration

| Property | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `request.body` | `unknown` | JSON request payload. Automatically stringified with `Content-Type: application/json`. | `body: { title: "New Item" }` |
| `request.headers` | `Record<string, string>` | Custom HTTP headers sent with the request. | `headers: { Range: "items=0-9" }` |
| `request.cookie` | `Record<string, string>` | Custom cookies sent with the request. | `cookie: { custom_cookie: "val" }` |
| `request.jwtPayload` | `JwtPayload \| null` | Authenticates the request by generating a signed JWT attached to the `__Host-auth` cookie. Set to `null` to explicitly test unauthenticated access. | `jwtPayload: { sub: standardUser.id }` |
| `request.attach` | `FileAttachment` | Multipart file upload payload. Automatically handled via Supertest's `.attach()`. | See below. |
| `request.withoutCsrfProtection` | `boolean` | When `true`, omits the CSRF cookie and `X-CSRF-Token` header on mutative requests (POST, PUT, DELETE) to verify 401 CSRF rejection. | `withoutCsrfProtection: true` |

#### File Attachment (`request.attach`)
```typescript
attach: {
  name: "avatar", // Form field name
  file: Buffer.from("..."), // Buffer or file path string
  options: {
    filename: "avatar.webp",
    contentType: "image/webp",
  },
}
```

---

### 2. `response` Expectations

| Property | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `response.status` | `number` | Expected HTTP response status code. | `status: 200` |
| `response.body` | `unknown` | Expected response body. Evaluated via deep equality, supporting Vitest asymmetric matchers. | `body: expect.any(Number)` |
| `response.headers` | `Record<string, string>` | Expected response headers (case-insensitive keys). | `headers: { "content-range": "items 0-9/42" }` |
| `response.and` | `(test: supertest.Test) => void` | Optional hook receiving the supertest request **before it is sent**, to register extra `.expect(...)` assertions (e.g. cookie assertions). supertest runs them on the response and fails the case if one fails. | See below. |

#### Custom Assertion Hook (`response.and`)
```typescript
import { cookies } from "supertest";

and: (test) => {
  test
    // Attribute names are lowercase: supertest's Set-Cookie parser lowercases them
    .expect(
      cookies.set({
        name: "__Host-auth",
        options: { httponly: true, samesite: "Strict", secure: true, path: "/" },
      }),
    )
    // cookies.set() only checks that options are present, not their values
    .expect("set-cookie", /__Host-auth=[^;]*;.* SameSite=Strict(;|$)/);
}
```

> [!CAUTION]
> `expect(cookies.set(...))` (Vitest `expect` with no matcher) asserts nothing:
> `cookies.set()` returns an assertion function that only runs when supertest
> calls it, which is what `test.expect(...)` does.

Reusable hooks live in `tests/contracts/assertions/` (e.g. `sessionCookieIsSet`).
That folder is not loaded as contracts: `tests/contracts/index.ts` only globs root files.

---

### 3. Special Case Modifiers

#### Focused Debugging (`only: true`)
To run a single test case while debugging without executing the entire test suite, add `only: true` to the case:

```typescript
cases: {
  failing_case: {
    only: true, // Executes only this case (it.only)
    request: { ... },
    response: { ... },
  },
}
```

#### URL Overrides (`specialPath`)
When testing invalid URL parameters, route mismatches, or malformed IDs, use `specialPath` to override the parent `test.path`:

```typescript
read: {
  method: "get",
  path: `/api/items/${firstItem.id}`,
  cases: {
    success: {
      request: {},
      response: { status: 200, body: firstItem },
    },
    not_found: {
      specialPath: `/api/items/${NaN}`, // Overrides /api/items/1 with /api/items/NaN
      request: {},
      response: { status: 404, body: {} },
    },
  },
}
```

---

## Standard Case Naming Conventions

Maintain consistency across all contract files by using standard case names:

| Case Name | Typical Method | Expected Status | Purpose |
| :--- | :--- | :--- | :--- |
| `success` | Any | 200, 201, 204, 206 | Happy path with valid input and permissions |
| `bad_request` | POST, PUT | 400 | Invalid payload, schema violation, or missing required fields |
| `unauthorized` | Any | 401 | Missing or invalid auth cookie (`jwtPayload: null`) |
| `forbidden` | PUT, DELETE | 403 | Authenticated user is not the resource owner |
| `not_found` | GET, PUT, DELETE | 404 | Resource does not exist (often via `specialPath: /.../${NaN}`) |
| `no_range` | GET (collection) | 400 | Collection queried without required `Range` header |
| `out_of_range` | GET (collection) | 416 | Requested slice exceeds total records (`Range: items=9999-9999`) |
