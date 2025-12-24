/*
  Purpose:
  Convert the `:userId` route parameter into a fully loaded Item.

  This module:
  - Centralizes user lookup logic
  - Attaches the resolved user to the request object
  - Stops the request early if the user does not exist

  Why this exists:
  - Avoids duplicated lookup code in controllers
  - Guarantees `req.user` for downstream handlers
  - Keeps route handlers small and predictable

  Related docs:
  - https://expressjs.com/en/5x/api.html#router.param
*/

/* ************************************************************************ */
/* Request augmentation                                                     */
/* ************************************************************************ */

/*
  Extend Express.Request to include `user`.

  After this param middleware runs successfully:
  - `req.user` is always defined
  - Controllers and guards can rely on it without null checks
*/
declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

/* ************************************************************************ */
/* Param converter                                                          */
/* ************************************************************************ */

import type { RequestParamHandler } from "express";

import userRepository from "./userRepository";

/*
  Param middleware for `:userId`.

  Behavior:
  - Attempts to load the user from the repository
  - If not found:
      - DELETE: 204 (idempotent deletion)
      - Other methods: 404 (resource not found)
  - If found:
      - Attaches user to `req`
      - Continues the middleware chain

  Design note:
  - HTTP semantics are handled here, not in controllers
  - Controllers never deal with "missing user" cases
*/
const convert: RequestParamHandler = async (req, res, next, userId) => {
  const user = await userRepository.read(+userId);

  if (user == null) {
    res.sendStatus(req.method === "DELETE" ? 204 : 404);
  } else {
    req.user = user;

    next();
  }
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default { convert };
