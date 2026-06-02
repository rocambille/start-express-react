/*
  Purpose:
  Define HTTP request handlers for User-related operations.

  This file:
  - Translates HTTP requests into repository calls
  - Shapes HTTP responses (status codes and payloads)
  - Assumes all upstream guarantees are already satisfied

  What this file intentionally does NOT do:
  - No authentication (handled by auth middleware)
  - No authorization (handled by route-level checks)
  - No input validation (handled by validators)
  - No database logic (handled by repositories)

  Design notes:
  - Each handler maps closely to a single use case
  - Side effects are explicit and minimal
  - Handlers remain thin to keep behavior easy to audit
*/

import type { RequestHandler } from "express";

import userRepository from "./userRepository";

/* ************************************************************************ */
/* Handlers                                                                 */
/* ************************************************************************ */

/*
  Return the currently authenticated user.

  Preconditions:
  - verifyAccessToken has run successfully
*/
const readMe: RequestHandler = (req, res) => {
  res.json(req.me);
};

/* ************************************************************************ */

/*
  Edit the currently authenticated user.

  Preconditions:
  - User is authenticated
  - req.body has been validated and sanitized

  Response:
  - 204 No Content on success
*/
const editMe: RequestHandler = (req, res) => {
  userRepository.update(req.me.id, req.body);

  res.sendStatus(204);
};

/* ************************************************************************ */

/*
  Soft-delete the currently authenticated user.

  Preconditions:
  - User is authenticated

  Response:
  - 204 No Content
*/
const destroyMe: RequestHandler = (req, res) => {
  userRepository.softDelete(req.me.id);

  res.sendStatus(204);
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default {
  readMe,
  editMe,
  destroyMe,
};
