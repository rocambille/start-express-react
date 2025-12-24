/*
  Purpose:
  Routes related to "items" resources.

  This file defines:
  - Public read endpoints
  - Authenticated write endpoints
  - Ownership-based authorization rules

  Guiding principles:
  - Read access is public
  - Write access is authenticated
  - Mutations are restricted to resource owners

  Related docs:
  - https://restfulapi.net/resource-naming/
  - https://expressjs.com/en/guide/routing.html
  - https://expressjs.com/en/5x/api.html#router.param
*/

/* ************************************************************************ */
/* Router setup                                                             */
/* ************************************************************************ */

import { Router } from "express";

const router = Router();

/* ************************************************************************ */
/* Dependencies                                                             */
/* ************************************************************************ */

/*
  authActions:
  - verifyAccessToken injects `req.auth`
  - `req.auth.sub` contains the authenticated user id
*/
import authActions from "../auth/authActions";

/*
  itemActions:
  - Thin controllers
  - One action per route
*/
import itemActions from "./itemActions";

/*
  itemParamConverter:
  - Centralizes item lookup
  - Attaches `req.item`
  - Fails fast if item does not exist
*/
import itemParamConverter from "./itemParamConverter";

/*
  itemValidator:
  - Validates request payloads
  - Prevents invalid data from reaching actions
*/
import itemValidator from "./itemValidator";

/* ************************************************************************ */
/* Route constants                                                          */
/* ************************************************************************ */

/*
  Paths are declared once to:
  - Avoid duplication
  - Make refactors trivial
*/
const BASE_PATH = "/api/items";
const ITEM_PATH = "/api/items/:itemId";

/* ************************************************************************ */
/* Param converter                                                          */
/* ************************************************************************ */

/*
  Automatically resolves :itemId parameters.

  After this middleware:
  - req.item is guaranteed to exist
  - Downstream handlers can assume a valid item
*/
router.param("itemId", itemParamConverter.convert);

/* ************************************************************************ */
/* Authorization rules                                                      */
/* ************************************************************************ */

import type { RequestHandler } from "express";

/*
  Ownership check.

  Authorization logic is kept:
  - Explicit
  - Local to the resource
  - Easy to audit

  Assumptions:
  - req.item.user_id is the owner
  - req.auth.sub is the authenticated user id
*/
const checkAccess: RequestHandler = (req, res, next) => {
  if (req.item.user_id === Number(req.auth.sub)) {
    next();
  } else {
    res.sendStatus(403);
  }
};

/* ************************************************************************ */
/* Public routes                                                            */
/* ************************************************************************ */

/*
  Public read-only endpoints.
  No authentication required.
*/
router.get(BASE_PATH, itemActions.browse);
router.get(ITEM_PATH, itemActions.read);

/* ************************************************************************ */
/* Authentication wall                                                      */
/* ************************************************************************ */

/*
  Everything below this line requires authentication.

  This pattern:
  - Makes the security boundary visually obvious
  - Avoids repeating auth middleware on every route
*/
router.use(BASE_PATH, authActions.verifyAccessToken);

/* ************************************************************************ */
/* Authenticated routes                                                     */
/* ************************************************************************ */

/*
  Create a new item.
  - Requires authentication
  - Validates payload before processing
*/
router.post(BASE_PATH, itemValidator.validate, itemActions.add);

/*
  Item-specific mutations.
  - Authentication already enforced
  - Ownership enforced via checkAccess
*/
router
  .route(ITEM_PATH)
  .all(checkAccess)
  .put(itemValidator.validate, itemActions.edit)
  .delete(itemActions.destroy);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
