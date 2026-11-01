/*
  Purpose:
  Shared supertest assertions on the session cookie, for contract cases.

  Usage, in a contract case:
    response: { status: 201, body: …, and: sessionCookieIsSet }

  How it works:
  - The `and` hook receives the supertest request before it is sent
  - `.expect(...)` registers assertions that supertest runs on the response
  - cookies.set() only checks that each option is present, not its value
    (supertest's parser also lowercases attribute names): the SameSite and
    Path values are checked on the Set-Cookie header itself

  Note:
  - This folder is not a contract: tests/contracts/index.ts only loads the
    files at its root
*/

import { cookies, type Test } from "supertest";

const SESSION_COOKIE = "__Host-auth";

export const sessionCookieIsSet = (test: Test) => {
  test
    .expect(
      cookies.set({
        name: SESSION_COOKIE,
        options: {
          httponly: true,
          samesite: "Strict",
          secure: true,
          path: "/",
        },
      }),
    )
    .expect("set-cookie", /__Host-auth=[^;]*;.* Path=\/;/)
    .expect("set-cookie", /__Host-auth=[^;]*;.* SameSite=Strict(;|$)/);
};

export const sessionCookieIsNotSet = (test: Test) => {
  test.expect(cookies.not("set", { name: SESSION_COOKIE }));
};
