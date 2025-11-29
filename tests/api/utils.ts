import express, { type ErrorRequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { QueryOptions } from "mysql2";
import supertest from "supertest";

import databaseClient from "../../src/database/client";
import routes from "../../src/express/routes";

// -------------------------
// Mocked DB content
// -------------------------
export const mockedData = {
  item: [{ id: 1, title: "foo", user_id: 1 }],
  user: [{ id: 1, email: "foo@mail.com" }],
};

// Allows a clean slate per test
export const resetMockData = () => {
  mockedData.item = [{ id: 1, title: "foo", user_id: 1 }];
  mockedData.user = [{ id: 1, email: "foo@mail.com" }];
};

export const mockedInsertId = 42;

// -------------------------
// DB mock
// -------------------------
export const mockDatabaseClient = () => {
  databaseClient.query = vi
    .fn()
    .mockImplementation(
      async (sqlOrOptions: string | QueryOptions, values?: unknown) => {
        let sql =
          typeof sqlOrOptions === "string" ? sqlOrOptions : sqlOrOptions.sql;

        if (Array.isArray(values)) {
          for (const value of values as unknown[]) {
            sql = sql.replace(/\?/, new Object(value).toString());
          }
        }

        // INSERT -----------------------------------
        if (/\binsert\b/i.test(sql)) {
          return [{ insertId: mockedInsertId }, []];
        }

        // SELECT -----------------------------------
        if (/\bselect\b/i.test(sql)) {
          const mayBeTable = sql.match(/\bfrom\s+(\w+)/i)?.[1];

          if (!mayBeTable || !Object.hasOwn(mockedData, mayBeTable)) {
            throw new Error(`Unrecognized table in query: ${sql}`);
          }

          const table: keyof typeof mockedData =
            mayBeTable as keyof typeof mockedData;

          // WHERE id = ?
          if (/\bwhere\s+id\s*=/i.test(sql)) {
            const id = sql.match(/\s+id\s*=\s*([^\s]+)/)?.at(1);

            return [
              mockedData[table].filter((row) => row.id === Number(id)),
              [],
            ];
          }

          // WHERE email = ?
          if (/\bwhere\s+email\s*=/i.test(sql)) {
            const email = sql.match(/\s+email\s*=\s*([^\s]+)/)?.at(1);

            return [
              mockedData[table].filter(
                (row) =>
                  ((
                    row as {
                      email?: string;
                    }
                  ).email ?? "") === email,
              ),
              [],
            ];
          }

          return [mockedData[table], []];
        }

        // UPDATE -----------------------------------
        if (/\bupdate\b/i.test(sql)) {
          const mayBeTable = sql.match(/\bupdate\s+(\w+)/i)?.[1];

          if (!mayBeTable || !Object.hasOwn(mockedData, mayBeTable)) {
            throw new Error(`Unrecognized table in query: ${sql}`);
          }

          const table: keyof typeof mockedData =
            mayBeTable as keyof typeof mockedData;

          const id = sql.match(/\s+id\s*=\s*([^\s]+)/)?.at(1);

          return [
            {
              affectedRows: mockedData[table].some(
                (row) => row.id === Number(id),
              )
                ? 1
                : 0,
            },
            [],
          ];
        }

        // DELETE -----------------------------------
        if (/\bdelete\b/i.test(sql)) {
          const mayBeTable = sql.match(/\bfrom\s+(\w+)/i)?.[1];

          if (!mayBeTable || !Object.hasOwn(mockedData, mayBeTable)) {
            throw new Error(`Unrecognized table in query: ${sql}`);
          }

          const table: keyof typeof mockedData =
            mayBeTable as keyof typeof mockedData;

          const id = sql.match(/\s+id\s*=\s*([^\s]+)/)?.at(1);

          return [
            {
              affectedRows: mockedData[table].some(
                (row) => row.id === Number(id),
              )
                ? 1
                : 0,
            },
            [],
          ];
        }

        throw new Error(`Unhandled SQL query: ${sql}`);
      },
    );
};

// -------------------------
// JWT.verify mock
// -------------------------
export const mockJwtVerify = (sub: string) => {
  return vi
    .spyOn(jwt, "verify")
    .mockImplementation((): JwtPayload => ({ sub }));
};

// -------------------------
// Express app for tests
// -------------------------
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
export const api = supertest(app);
