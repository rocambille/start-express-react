/*
  Purpose:
  Validate and normalize incoming User payloads for mutative requests.

  This validator:
  - Enforces shape and constraints of User DTOs
  - Injects trusted server-side data (user_id)
  - Acts as a boundary between untrusted input and business logic

  What this file intentionally does NOT do:
  - No authorization checks (handled elsewhere)
  - No persistence logic
  - No HTTP routing decisions

  Design notes:
  - Validation happens as early as possible in the request pipeline
  - Zod is used for explicit, composable schemas
  - Parsed data replaces req.body to guarantee type safety downstream

  Related docs:
  - https://zod.dev/
*/

/* ************************************************************************ */
/* Schema                                                                   */
/* ************************************************************************ */

import { type ZodError, z } from "zod";

/*
  User Data Transfer Object (DTO)

  Notes:
  - `id` is optional to allow reuse for different operations
  - `confirmPassword` is compared against `password`
*/
const userDTOSchema = z
  .object({
    id: z.number().optional(),
    email: z.email().max(255),
    password: z.string().max(255),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // path of error
  });

/* ************************************************************************ */
/* Middleware                                                               */
/* ************************************************************************ */

import type { RequestHandler } from "express";

/*
  Validate and sanitize request body.

  Behavior:
  - Replaces req.body with a validated, typed object
  - Returns 400 with detailed issues on validation failure

  Why override req.body:
  - Downstream handlers can rely on a safe, known structure
  - Eliminates repeated parsing or defensive checks
*/
const validate: RequestHandler = (req, res, next) => {
  try {
    req.body = userDTOSchema.parse(req.body);

    next();
  } catch (err) {
    const { issues } = err as ZodError;

    res.status(400).json(issues);
  }
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default { validate };
