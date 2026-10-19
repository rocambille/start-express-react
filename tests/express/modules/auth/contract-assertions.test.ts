/*
  Purpose:
  Prove that contract assertions really run and fail when they should.
  The previous pattern, expect(cookies.set(...)), built an assertion
  without ever running it: the auth contract checked nothing.
*/

import express, { type CookieOptions } from "express";
import supertest from "supertest";
import contracts from "../../../contracts";
import {
  sessionCookieIsNotSet,
  sessionCookieIsSet,
} from "../../../contracts/assertions/session";
import { check, setupMocks } from "../../test-utils";

const withHook = (
  caseName: "success" | "unauthorized",
  and: Case["response"]["and"],
) => {
  const { verify } = contracts.auth;
  const base = verify.cases[caseName];

  return check(
    {
      ...verify,
      cases: { current: { ...base, response: { ...base.response, and } } },
    },
    "current",
  );
};

// A server setting the session cookie with the given options
const serverSetting = (options: CookieOptions) => {
  const app = express();

  app.get("/", (_req, res) => {
    res.cookie("__Host-auth", "token", { path: "/", ...options }).send("ok");
  });

  return supertest(app).get("/");
};

describe("Contract assertions", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fail when the expected session cookie is missing", async () => {
    await expect(withHook("unauthorized", sessionCookieIsSet)).rejects.toThrow(
      /__Host-auth cookie to be set/,
    );
  });

  it("fail when an unexpected session cookie is set", async () => {
    await expect(withHook("success", sessionCookieIsNotSet)).rejects.toThrow();
  });

  it("check the SameSite value, not only its presence", async () => {
    const test = serverSetting({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    sessionCookieIsSet(test);

    await expect(test).rejects.toThrow(/SameSite=Strict/);
  });

  it("check the HttpOnly attribute", async () => {
    const test = serverSetting({ secure: true, sameSite: "strict" });

    sessionCookieIsSet(test);

    await expect(test).rejects.toThrow(/httponly/);
  });

  it("pass on the actual session cookie", async () => {
    await expect(
      withHook("success", sessionCookieIsSet),
    ).resolves.toBeDefined();
  });
});
