/*
  Purpose:
  Provide shared utilities for Express modules.

  Related docs:
  - https://zod.dev/
*/

import type { Request, RequestHandler } from "express";
import type { ZodObject } from "zod";

/* ************************************************************************ */
/* createValidator                                                          */
/* ************************************************************************ */

/*
  createValidator(schema):
  - Returns an Express middleware that validates req.body against a Zod schema
  - Replaces req.body with the parsed (typed, sanitized) result
  - Returns 400 with detailed Zod issues on validation failure
*/
export const createValidator = (
  schema: ZodObject,
  options: { inject?: (req: Request) => Record<string, unknown> } = {},
): { validate: RequestHandler } => ({
  validate: (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const { issues } = parsed.error;

      res.status(400).json(issues);

      return;
    }

    const { inject } = options;

    if (inject) {
      req.body = { ...parsed.data, ...inject(req) };
    } else {
      req.body = parsed.data;
    }

    next();
  },
});
