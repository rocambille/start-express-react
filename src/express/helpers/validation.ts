/*
  Purpose:
  Provide shared utilities for Express modules.

  Related docs:
  - https://zod.dev/
*/

import type { Request, RequestHandler } from "express";
import type { ZodObject } from "zod";
import type { $ZodIssue as ZodIssue } from "zod/v4/core";

/* ************************************************************************ */
/* Types                                                                    */
/* ************************************************************************ */

/**
 * Multi-target validation schema options.
 */
export type ValidationTargets = {
  body?: ZodObject;
  query?: ZodObject;
  params?: ZodObject;
};

export type ValidatorOptions = {
  inject?: (req: Request) => Record<string, unknown>;
};

/* ************************************************************************ */
/* createValidator                                                          */
/* ************************************************************************ */

/*
  createValidator(targets, options):
  - Accepts a multi-target object ({ body, query, params })
  - Replaces validated request targets with parsed (typed, sanitized) results
  - Returns 400 with detailed Zod issues on validation failure
  - Supports optional server-side injection into req.body via options.inject
*/
export const createValidator = (
  targets: ValidationTargets,
  options: ValidatorOptions = {},
): RequestHandler => {
  return (req, res, next) => {
    const issues: ZodIssue[] = [];

    if (targets.params) {
      const parsed = targets.params.safeParse(req.params);
      if (!parsed.success) {
        issues.push(...parsed.error.issues);
      } else {
        req.params = parsed.data as typeof req.params;
      }
    }

    if (targets.query) {
      const parsed = targets.query.safeParse(req.query);
      if (!parsed.success) {
        issues.push(...parsed.error.issues);
      } else {
        req.query = parsed.data as typeof req.query;
      }
    }

    if (targets.body) {
      const parsed = targets.body.safeParse(req.body);
      if (!parsed.success) {
        issues.push(...parsed.error.issues);
      } else {
        const { inject } = options;

        if (inject) {
          req.body = { ...parsed.data, ...inject(req) };
        } else {
          req.body = parsed.data;
        }
      }
    }

    if (issues.length > 0) {
      res.status(400).json(issues);
      return;
    }

    next();
  };
};
