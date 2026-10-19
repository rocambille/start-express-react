import { authTokens } from "../fixtures/auth";
import { standardUser } from "../fixtures/users";
import {
  sessionCookieIsNotSet,
  sessionCookieIsSet,
} from "./assertions/session";

export default (<Contract>{
  magic_link: {
    method: "post",
    path: "/api/auth/magic-link",
    cases: {
      success: {
        request: {
          body: {
            email: standardUser.email,
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
            token: authTokens.success,
          },
        },
        response: {
          status: 201,
          body: standardUser,
          and: sessionCookieIsSet,
        },
      },
      bad_request: {
        request: { body: {} },
        response: {
          status: 400,
          body: expect.any(Object),
          and: sessionCookieIsNotSet,
        },
      },
      unauthorized: {
        request: { body: { token: "invalid_token" } },
        response: {
          status: 401,
          body: {},
          and: sessionCookieIsNotSet,
        },
      },
      consumed: {
        request: { body: { token: authTokens.consumed } },
        response: {
          status: 401,
          body: {},
          and: sessionCookieIsNotSet,
        },
      },
      expired: {
        request: { body: { token: authTokens.expired } },
        response: {
          status: 401,
          body: {},
          and: sessionCookieIsNotSet,
        },
      },
      deleted_user: {
        request: {
          body: { token: authTokens.deletedUser },
          jwtPayload: { sub: "deleted@mail.com" },
        },
        response: {
          status: 401,
          body: {},
          and: sessionCookieIsNotSet,
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
