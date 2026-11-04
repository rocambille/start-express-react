/*
  Purpose:
  Verify that the session token expires with its cookie.

  jsonwebtoken reads a numeric expiresIn as seconds, while the cookie maxAge
  is in milliseconds: passing one for the other made tokens valid for
  19 years. The contracts mock jwt.sign, so real tokens are signed here.
*/

import jwt, { type JwtPayload } from "jsonwebtoken";

import contracts from "../../../contracts";
import { check, setupMocks } from "../../test-utils";

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

describe("Session lifetime", () => {
  beforeEach(() => {
    setupMocks();

    // Sign real tokens: their lifetime is what this test checks
    vi.mocked(jwt.sign).mockRestore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("expires the token with the cookie, after 7 days", async () => {
    const response = await check(contracts.auth.verify, "success");

    const cookie = [response.headers["set-cookie"]]
      .flat()
      .find((header) => header?.startsWith("__Host-auth="));

    const token = cookie?.split(";")[0].split("=")[1] ?? "";
    const maxAge = Number(/Max-Age=(\d+)/.exec(cookie ?? "")?.[1]);
    const { iat = 0, exp = 0 } = jwt.decode(token) as JwtPayload;

    expect(maxAge).toBe(SEVEN_DAYS_IN_SECONDS);
    expect(exp - iat).toBe(maxAge);
  });
});
