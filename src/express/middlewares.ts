/*
  Purpose:
  Collection of shared Express middlewares used across the API.

  This file intentionally contains only:
  - Stateless middleware
  - Security-related cross-cutting concerns

  No business logic should live here.

  Related docs:
  - https://expressjs.com/en/guide/using-middleware.html
  - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - https://github.com/Psifi-Solutions/csrf-csrf/blob/main/FAQ.md
*/

import type { Request, RequestHandler } from "express";

/* ************************************************************************ */
/* CSRF protection (Client-side double-submit pattern)                      */
/* ************************************************************************ */

/*
  Default CSRF configuration.

  Design choices:
  - Uses a double-submit cookie strategy
  - Requires no server-side storage (stateless)
  - Designed for same-site React + Express architecture

  cookieName:
  - Uses "__Host-" prefix to enforce:
    * Secure context
    * Path=/
    * No Domain attribute
    (enforced by modern browsers)

  ignoredMethods:
  - Safe HTTP methods do not mutate state and are not protected

  getCsrfTokenFromRequest:
  - Allows customizing how the token is read (header, body, etc.)
*/
const csrfDefaults = {
  cookieName: "__Host-x-csrf-token",
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"],
};

/*
  csrf()

  Factory returning an Express middleware.

  Why a factory?
  - Allows overriding defaults per router if needed
  - Keeps global configuration explicit and testable

  Security model:
  - For mutative requests:
      * Read CSRF token from request (header)
      * Compare it with the value stored in the cookie
  - Reject if missing or mismatching
*/
export const csrf =
  ({
    cookieName,
    ignoredMethods,
    getCsrfTokenFromRequest,
  } = csrfDefaults): RequestHandler =>
  (req, res, next) => {
    /*
      Skip CSRF validation for safe methods.
      This keeps read-only endpoints frictionless.
    */
    if (req.method.match(new RegExp(`(${ignoredMethods.join("|")})`, "i"))) {
      next();
      return;
    }

    const tokenFromRequest = getCsrfTokenFromRequest(req);
    const tokenFromCookie = req.cookies[cookieName];

    /*
      Reject the request if:
      - the CSRF header is missing
      - or the header and cookie do not match

      A 401 is used here to signal an authentication-related failure
      without leaking details about the cause.
    */
    if (tokenFromRequest == null || tokenFromRequest !== tokenFromCookie) {
      res.sendStatus(401);
      return;
    }

    next();
  };
