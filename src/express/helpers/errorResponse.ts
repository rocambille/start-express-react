/*
  Purpose:
  Build the final error handler: a structured JSON response instead of
  Express's default HTML page.

  Security model:
  - Client errors (4xx) keep their message: it is meant for the user
    (e.g. "Invalid file type")
  - Server errors (5xx) never expose their message in production: it may
    reveal internals (SQL, SMTP hosts, file paths). It is logged by the
    previous handler; the client gets a generic message
  - Stack traces are only sent outside production
*/

import type { ErrorRequestHandler } from "express";
import { MulterError } from "multer";

export const createErrorResponse =
  (isProduction: boolean): ErrorRequestHandler =>
  (err, _req, res, _next) => {
    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      res.sendStatus(400);
      return;
    }

    const status = err.status ?? err.statusCode ?? 500;
    const isServerError = status >= 500;

    res.status(status).json({
      message:
        isProduction && isServerError
          ? "Internal Server Error"
          : (err.message ?? "Internal Server Error"),
      ...(isProduction ? {} : { stack: err.stack }),
    });
  };
