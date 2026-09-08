/*
  Purpose:
  Unit tests for the csrf middleware helper in csrf.ts.

  Strategy:
  - Test safe HTTP methods (GET, HEAD, OPTIONS) pass through without CSRF validation
  - Test case-insensitivity of HTTP methods
  - Test mutative HTTP methods (POST, PUT, DELETE, PATCH) validate token matching
  - Test missing headers or missing/mismatched cookies return 401
*/

import type { NextFunction, Request, Response } from "express";
import { csrf } from "../../../src/express/helpers/csrf";

describe("csrf middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: ReturnType<typeof vi.fn>;
  let sendStatusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendStatusSpy = vi.fn().mockImplementation(() => mockRes);
    nextFn = vi.fn();
    mockRes = {
      sendStatus: sendStatusSpy as unknown as Response["sendStatus"],
    };
  });

  it("skips CSRF check for safe HTTP methods (GET, HEAD, OPTIONS)", () => {
    const middleware = csrf();

    for (const method of ["GET", "get", "HEAD", "head", "OPTIONS", "options"]) {
      mockReq = { method, cookies: {} };
      middleware(
        mockReq as Request,
        mockRes as Response,
        nextFn as unknown as NextFunction,
      );
      expect(nextFn).toHaveBeenCalled();
      expect(sendStatusSpy).not.toHaveBeenCalled();
      nextFn.mockClear();
    }
  });

  it("validates CSRF token for mutative HTTP methods (POST, PUT, DELETE, PATCH)", () => {
    const middleware = csrf();

    mockReq = {
      method: "POST",
      headers: { "x-csrf-token": "valid-token" },
      cookies: { "__Host-x-csrf-token": "valid-token" },
    };

    middleware(
      mockReq as Request,
      mockRes as Response,
      nextFn as unknown as NextFunction,
    );
    expect(nextFn).toHaveBeenCalled();
    expect(sendStatusSpy).not.toHaveBeenCalled();
  });

  it("returns 401 if request token is missing for mutative methods", () => {
    const middleware = csrf();

    mockReq = {
      method: "POST",
      headers: {},
      cookies: { "__Host-x-csrf-token": "valid-token" },
    };

    middleware(
      mockReq as Request,
      mockRes as Response,
      nextFn as unknown as NextFunction,
    );
    expect(sendStatusSpy).toHaveBeenCalledWith(401);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it("returns 401 if cookie and request header mismatch", () => {
    const middleware = csrf();

    mockReq = {
      method: "POST",
      headers: { "x-csrf-token": "token-a" },
      cookies: { "__Host-x-csrf-token": "token-b" },
    };

    middleware(
      mockReq as Request,
      mockRes as Response,
      nextFn as unknown as NextFunction,
    );
    expect(sendStatusSpy).toHaveBeenCalledWith(401);
    expect(nextFn).not.toHaveBeenCalled();
  });
});
