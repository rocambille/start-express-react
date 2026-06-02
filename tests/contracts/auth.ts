import { cookies } from "supertest";

import { fooUser } from "../fixtures/users";

export default (<Contract>{
  magic_link: {
    method: "post",
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
  verify: {
    method: "post",
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
    method: "post",
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
});
