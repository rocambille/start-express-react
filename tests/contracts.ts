/*
  Purpose:
  Define the API contracts for the StartER framework.

  What are Contracts?
  - A central, declarative "Point of Truth" for API behavior.
  - Separates test data (what?) from test logic (how?).
  - Serves as living documentation for developers and students.

  Structure:
  - Contract: a collection of related Tests (e.g., "items", "auth")
  - Test: a specific endpoint and method
  - Case: a scenario (e.g., "success", "unauthorized", "bad_request")

  Conventions:
  - Ordered by status code (ascending)
  - Error names follow HTTP status text in snake_case
*/

import { cookies } from "supertest";

import { allItems, allUsers, barUser, deletedUser, fooUser } from "./data";

/* ************************************************************************ */
/* Types                                                                    */
/* ************************************************************************ */

export type Json =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | JsonObject
  | JsonArray;

export type JsonObject = { [key: string]: Json };
export type JsonArray = Json[];

export type Case = {
  only?: boolean;
  // Optional path override (useful for IDs)
  specialPath?: string;
  request: {
    body?: JsonObject;
    // Mocked JWT payload to simulate different users
    jwtPayload?: { sub: RowId | string } | null;
    // Explicitly bypass CSRF to test protection
    withoutCsrfProtection?: boolean;
  };
  response: {
    status: number;
    body?: JsonObject | JsonArray;
    // Optional hook to run extra assertions on the response
    and?: (response: { headers: { [key: string]: string } }) => void;
  };
};

export type Test = {
  method: "get" | "post" | "put" | "delete";
  path: string;
  cases: Record<string, Case>;
};

export type Contract = Record<string, Test>;

/* ************************************************************************ */
/* Contracts Definitions                                                    */
/* ************************************************************************ */

export const contracts: Record<string, Contract> = {
  auth: {
    magic_link: {
      method: "post" as const,
      path: "/api/auth/magic-link",
      cases: {
        success: {
          request: {
            body: {
              email: fooUser.email,
            },
          },
          response: {
            status: 204,
            body: {},
          },
        },
        new_user: {
          request: {
            body: { email: "new_user@mail.com" },
          },
          response: {
            status: 204,
            body: {},
          },
        },
        bad_request: {
          request: { body: {} },
          response: { status: 400, body: expect.any(Object) },
        },
      },
    },
    me: {
      method: "get" as const,
      path: "/api/me",
      cases: {
        success: {
          request: {
            jwtPayload: { sub: fooUser.id },
          },
          response: {
            status: 200,
            body: fooUser,
          },
        },
        guest: {
          request: {},
          response: { status: 401, body: {} },
        },
        unauthorized: {
          request: { jwtPayload: { sub: NaN } },
          response: { status: 401, body: {} },
        },
      },
    },
    verify: {
      method: "post" as const,
      path: "/api/auth/verify",
      cases: {
        success: {
          request: {
            body: {
              token: "success_token",
            },
          },
          response: {
            status: 201,
            body: fooUser,
            and: () => {
              expect(
                cookies.set({
                  name: "__Host-auth",
                  options: {
                    httpOnly: true,
                    sameSite: "strict",
                    secure: true,
                    path: "/",
                  },
                }),
              );
            },
          },
        },
        bad_request: {
          request: { body: {} },
          response: {
            status: 400,
            body: expect.any(Object),
            and: () => {
              expect(
                cookies.not("set", {
                  name: "__Host-auth",
                }),
              );
            },
          },
        },
        unauthorized: {
          request: { body: { token: "invalid_token" } },
          response: {
            status: 401,
            body: {},
            and: () => {
              expect(
                cookies.not("set", {
                  name: "__Host-auth",
                }),
              );
            },
          },
        },
        consumed: {
          request: { body: { token: "consumed_token" } },
          response: {
            status: 401,
            body: {},
            and: () => {
              expect(
                cookies.not("set", {
                  name: "__Host-auth",
                }),
              );
            },
          },
        },
        expired: {
          request: { body: { token: "expired_token" } },
          response: {
            status: 401,
            body: {},
            and: () => {
              expect(
                cookies.not("set", {
                  name: "__Host-auth",
                }),
              );
            },
          },
        },
        deleted_user: {
          request: {
            body: { token: "deleted_token" },
            jwtPayload: { sub: "deleted@mail.com" },
          },
          response: {
            status: 401,
            body: {},
            and: () => {
              expect(
                cookies.not("set", {
                  name: "__Host-auth",
                }),
              );
            },
          },
        },
      },
    },
    logout: {
      method: "post" as const,
      path: "/api/auth/logout",
      cases: {
        anyone: {
          request: {},
          response: {
            status: 204,
            body: {},
          },
        },
      },
    },
  },
  health: {
    get: {
      method: "get",
      path: "/api/health",
      cases: {
        success: {
          request: {},
          response: { status: 200, body: { hello: "world" } },
        },
      },
    },
    post: {
      method: "post",
      path: "/api/health",
      cases: {
        success: {
          request: { body: { foo: "bar" } },
          response: { status: 200, body: { foo: "bar" } },
        },
        unauthorized: {
          request: { body: { foo: "bar" }, withoutCsrfProtection: true },
          response: { status: 401, body: {} },
        },
      },
    },
  },
  items: {
    browse: {
      method: "get",
      path: "/api/items",
      cases: {
        success: {
          request: {},
          response: { status: 200, body: allItems },
        },
      },
    },
    create: {
      method: "post",
      path: "/api/items",
      cases: {
        success: {
          request: {
            body: { title: "new item" },
            jwtPayload: { sub: fooUser.id },
          },
          response: { status: 201, body: { insertId: expect.any(Number) } },
        },
        bad_request: {
          request: { body: {}, jwtPayload: { sub: fooUser.id } },
          response: { status: 400, body: expect.any(Array) },
        },
        unauthorized: {
          request: { body: { title: "new item" }, jwtPayload: null },
          response: { status: 401, body: {} },
        },
      },
    },
    delete: {
      method: "delete",
      path: `/api/items/${allItems[0].id}`,
      cases: {
        success: {
          request: { jwtPayload: { sub: fooUser.id } },
          response: { status: 204, body: {} },
        },
        unauthorized: {
          request: { jwtPayload: null },
          response: { status: 401, body: {} },
        },
        forbidden: {
          request: { jwtPayload: { sub: barUser.id } },
          response: { status: 403, body: {} },
        },
        not_found: {
          specialPath: `/api/items/${NaN}`,
          request: { jwtPayload: { sub: fooUser.id } },
          response: { status: 204, body: {} },
        },
      },
    },
    edit: {
      method: "put",
      path: `/api/items/${allItems[0].id}`,
      cases: {
        success: {
          request: {
            body: { title: "updated" },
            jwtPayload: { sub: allItems[0].user_id },
          },
          response: { status: 204, body: {} },
        },
        forbidden: {
          request: {
            body: { title: "updated" },
            jwtPayload: { sub: barUser.id },
          },
          response: { status: 403, body: {} },
        },
        not_found: {
          specialPath: `/api/items/${NaN}`,
          request: {
            body: { title: "updated" },
            jwtPayload: { sub: fooUser.id },
          },
          response: { status: 404, body: {} },
        },
      },
    },
    read: {
      method: "get",
      path: `/api/items/${allItems[0].id}`,
      cases: {
        success: {
          request: {},
          response: { status: 200, body: allItems[0] },
        },
        not_found: {
          specialPath: `/api/items/${NaN}`,
          request: {},
          response: { status: 404, body: {} },
        },
      },
    },
  },
  users: {
    browse: {
      method: "get",
      path: "/api/users",
      cases: {
        success: {
          request: {},
          response: {
            status: 200,
            body: allUsers.filter((user) => user.id !== deletedUser.id),
          },
        },
      },
    },
    delete: {
      method: "delete",
      path: `/api/users/${fooUser.id}`,
      cases: {
        success: {
          request: { jwtPayload: { sub: fooUser.id } },
          response: { status: 204, body: {} },
        },
        unauthorized: {
          request: { jwtPayload: null },
          response: { status: 401, body: {} },
        },
        forbidden: {
          request: { jwtPayload: { sub: barUser.id } },
          response: { status: 403, body: {} },
        },
        not_found: {
          specialPath: `/api/users/${NaN}`,
          request: { jwtPayload: { sub: fooUser.id } },
          response: { status: 204, body: {} },
        },
      },
    },
    edit: {
      method: "put",
      path: `/api/users/${fooUser.id}`,
      cases: {
        success: {
          request: {
            body: { email: "updated@mail.com", name: "updated" },
            jwtPayload: { sub: fooUser.id },
          },
          response: { status: 204, body: {} },
        },
        forbidden: {
          request: {
            body: { email: "updated@mail.com", name: "updated" },
            jwtPayload: { sub: barUser.id },
          },
          response: { status: 403, body: {} },
        },
        not_found: {
          specialPath: `/api/users/${NaN}`,
          request: {
            body: { email: "updated@mail.com", name: "updated" },
            jwtPayload: { sub: fooUser.id },
          },
          response: { status: 404, body: {} },
        },
      },
    },
    read: {
      method: "get",
      path: `/api/users/${fooUser.id}`,
      cases: {
        success: {
          request: {},
          response: { status: 200, body: fooUser },
        },
        not_found: {
          specialPath: `/api/users/${NaN}`,
          request: {},
          response: { status: 404, body: {} },
        },
      },
    },
  },
};
