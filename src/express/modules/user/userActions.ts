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
  Browse all users.

  Preconditions:
  - None (public endpoint)

  Response:
  - 200 with an array of users
*/
const browse: RequestHandler = async (_req, res) => {
  const users = await userRepository.readAll();

  res.json(users);
};

/* ************************************************************************ */

/*
  Read a single user.

  Preconditions:
  - `req.user` has been injected by the param converter

  Response:
  - 200 with the user payload
*/
const read: RequestHandler = async (req, res) => {
  res.json(req.user);
};

/* ************************************************************************ */

/*
  Edit an existing user.

  Preconditions:
  - User is authenticated
  - User is authorized to access this user
  - req.body has been validated and sanitized

  Response:
  - 204 No Content on success
*/
const edit: RequestHandler = async (req, res) => {
  await userRepository.update(req.user.id, req.body);

  res.sendStatus(204);
};

/* ************************************************************************ */

/*
  Soft-delete a user.

  Preconditions:
  - User is authenticated
  - User is authorized to access this user

  Response:
  - 204 No Content
*/
const destroy: RequestHandler = async (req, res) => {
  await userRepository.softDelete(req.user.id);

  res.sendStatus(204);
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default {
  browse,
  read,
  edit,
  destroy,
};
