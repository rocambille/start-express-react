import type { Request, RequestHandler } from "express";

const csrfDefaults = {
  cookieName: "__Host-x-csrf-token",
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"],
};

export const csrf =
  ({
    cookieName,
    ignoredMethods,
    getCsrfTokenFromRequest,
  } = csrfDefaults): RequestHandler =>
  (req, res, next) => {
    if (
      !req.method.match(new RegExp(`(${ignoredMethods.join("|")})`, "i")) &&
      (getCsrfTokenFromRequest(req) == null ||
        getCsrfTokenFromRequest(req) !== req.cookies[cookieName])
    ) {
      res.sendStatus(401);
      return;
    }

    next();
  };
