/*
  Purpose:
  Verify that the test app logs server errors (5xx), so that a failing
  contract shows the actual bug instead of a bare status.
*/

import type { Request, Response } from "express";

import { logErrors } from "./test-utils";

const log = (err: object) => {
  const next = vi.fn();

  logErrors(
    err,
    { method: "GET", path: "/api/probe" } as Request,
    {} as Response,
    next,
  );

  expect(next).toHaveBeenCalledWith(err);
};

describe("Test app error logging", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs errors without status (they end as 500)", () => {
    const err = new TypeError("Cannot destructure property 'email'");

    log(err);

    expect(consoleError).toHaveBeenCalledWith(err);
  });

  it("logs errors with status 500", () => {
    log(Object.assign(new Error("boom"), { status: 500 }));

    expect(consoleError).toHaveBeenCalled();
  });

  it("logs other server errors", () => {
    log(Object.assign(new Error("SMTP unavailable"), { statusCode: 503 }));

    expect(consoleError).toHaveBeenCalled();
  });

  it("does not log client errors", () => {
    log(Object.assign(new Error("Invalid file type"), { status: 400 }));

    expect(consoleError).not.toHaveBeenCalled();
  });
});
