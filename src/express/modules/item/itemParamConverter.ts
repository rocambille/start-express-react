/*
  Purpose:
  Convert the `:itemId` route parameter into a fully loaded Item.

  This module:
  - Centralizes item lookup logic
  - Attaches the resolved item to the request object
  - Stops the request early if the item does not exist

  Why this exists:
  - Avoids duplicated lookup code in controllers
  - Guarantees `req.item` for downstream handlers
  - Keeps route handlers small and predictable

  Related docs:
  - https://expressjs.com/en/5x/api.html#router.param
*/

/* ************************************************************************ */
/* Request augmentation                                                     */
/* ************************************************************************ */

/*
  Extend Express.Request to include `item`.

  After this param middleware runs successfully:
  - `req.item` is always defined
  - Controllers and guards can rely on it without null checks
*/
declare global {
  namespace Express {
    interface Request {
      item: Item;
    }
  }
}

/* ************************************************************************ */
/* Param converter                                                          */
/* ************************************************************************ */

import type { RequestParamHandler } from "express";

import itemRepository from "./itemRepository";

/*
  Param middleware for `:itemId`.

  Behavior:
  - Attempts to load the item from the repository
  - If not found:
      - DELETE: 204 (idempotent deletion)
      - Other methods: 404 (resource not found)
  - If found:
      - Attaches item to `req`
      - Continues the middleware chain

  Design note:
  - HTTP semantics are handled here, not in controllers
  - Controllers never deal with "missing item" cases
*/
const convert: RequestParamHandler = async (req, res, next, itemId) => {
  const item = await itemRepository.read(+itemId);

  if (item == null) {
    res.sendStatus(req.method === "DELETE" ? 204 : 404);
    return;
  }

  req.item = item;

  next();
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default { convert };
