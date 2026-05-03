import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import express, { type ErrorRequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import supertest from "supertest";

import database from "../../src/database";
import {
  allItems,
  allUsers,
  barUser,
  bazUser,
  deletedUser,
  fooUser,
} from "../data";

// -------------------------
// DB mock
// -------------------------

vi.mock("../../src/database", () => ({
  default: new DatabaseSync(":memory:"),
}));

const mockDatabase = () => {
  /* drop existing tables */
  const existingTables = database
    .prepare(`
    select name 
    from sqlite_schema 
    where type ='table' and name not like 'sqlite_%'`)
    .all();

  /* prevent errors because of cascade deletion */
  database.exec("PRAGMA foreign_keys = OFF");

  for (const table of existingTables) {
    database.exec(`drop table "${table.name}"`);
  }

  /* re-enable cascade deletion */
  database.exec("PRAGMA foreign_keys = ON");

  /* load schema */
  const schema = path.join(
    import.meta.dirname,
    "../../src/database/schema.sql",
  );

  const schemaSql = fs.readFileSync(schema, "utf8");
  database.exec(schemaSql);

  /* insert all users */
  const insertUser = database.prepare(
    "insert into user(id, email, name) values(?, ?, ?)",
  );
  for (const user of allUsers) {
    insertUser.run(user.id, user.email, user.name);
  }

  /* soft delete one user for tests */
  const deleteUser = database.prepare(
    "update user set deleted_at = datetime('now') where id = ?",
  );
  deleteUser.run(deletedUser.id);

  /* insert all items */
  const insertItem = database.prepare(
    "insert into item(id, title, user_id) values(?, ?, ?)",
  );
  for (const item of allItems) {
    insertItem.run(item.id, item.title, item.user_id);
  }

  /* insert magic link tokens */
  const insertMagicLinkToken = database.prepare(
    "insert into magic_link_token(user_id, token_hash, expires_at, consumed_at) values(?, ?, ?, ?)",
  );

  const hash = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");

  /* valid token for testing valid token scenarios */
  const validDate = new Date(Date.now() + 100000);
  insertMagicLinkToken.run(
    fooUser.id,
    hash(requestValue("auth", "verify", "success", "token")),
    validDate.toISOString(),
    null,
  );

  /* expired token for testing expired token scenarios */
  const expiredDate = new Date(Date.now() - 100000);
  insertMagicLinkToken.run(
    barUser.id,
    hash(requestValue("auth", "verify", "expired", "token")),
    expiredDate.toISOString(),
    null,
  );

  /* consumed token for testing consumed token scenarios */
  insertMagicLinkToken.run(
    bazUser.id,
    hash(requestValue("auth", "verify", "consumed", "token")),
    validDate.toISOString(),
    validDate.toISOString(),
  );

  /* deleted user for testing deleted user scenarios */
  insertMagicLinkToken.run(
    deletedUser.id,
    hash(requestValue("auth", "verify", "deleted_user", "token")),
    validDate.toISOString(),
    null,
  );
};

// -------------------------
// Nodemailer mock
// -------------------------

vi.mock("nodemailer", async (importActual) => {
  const actual = await importActual<typeof import("nodemailer")>();
  return {
    ...actual,
    default: {
      ...actual,
      createTransport: vi.fn(() =>
        actual.createTransport({ jsonTransport: true }),
      ),
    },
  };
});

// -------------------------
// Helpers
// -------------------------

import { type Contract, contracts, type Test } from "../contracts";

export const setupMocks = () => {
  mockDatabase();

  vi.spyOn(jwt, "sign").mockImplementation(() => "fake_jwt_token");
};

export const requestValue = (
  contractName: keyof typeof contracts,
  testName: keyof Contract,
  caseName: keyof Test["cases"],
  field: string,
) => {
  const body = contracts[contractName][testName].cases[caseName].request.body;
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    return body[field]?.toString() ?? "";
  }
  throw new Error(`Case body is not an object: ${JSON.stringify(body)}`);
};

// -------------------------
// Express app for tests
// -------------------------
import routes from "../../src/express/routes";

const app = express();
app.use(routes);

// Log server-side errors for debugging
const logErrors: ErrorRequestHandler = (err, req, _res, next) => {
  console.error("Express error:", err);
  console.error("Request:", req.method, req.path);
  next(err);
};

app.use(logErrors);

// Wrapper for supertest
const api = supertest(app);

// Helper to check a test case
export const check = async (test: Test, caseName: keyof Test["cases"]) => {
  const c = test.cases[caseName];

  const apiCall = api[test.method](c.specialPath ?? test.path);

  if (c.request.body != null) {
    apiCall.send(c.request.body);
  }

  const cookies = [];

  if (c.request.jwtPayload !== undefined) {
    cookies.push("__Host-auth=jwt");

    vi.spyOn(jwt, "verify").mockImplementation((): JwtPayload => {
      if (c.request.jwtPayload == null) {
        throw new Error("Invalid token");
      }

      return { sub: c.request.jwtPayload.sub.toString() };
    });
  }

  if (apiCall.method !== "GET" && !c.request.withoutCsrfProtection) {
    apiCall.set("X-CSRF-Token", "a-b-c-d-e");
    cookies.push("__Host-x-csrf-token=a-b-c-d-e");
  }

  const response = await apiCall.set("Cookie", cookies);

  expect(response.status).toBe(c.response.status);
  expect(response.body).toEqual(c.response.body);

  if (c.response.and) {
    c.response.and(response);
  }

  return response;
};
