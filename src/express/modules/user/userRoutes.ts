/*
  Purpose:
  Routes related to "users" resources.

  This file defines:
  - Authenticated endpoints

  Guiding principles:
  - Users can only access their own data

  Related docs:
  - https://restfulapi.net/resource-naming/
  - https://expressjs.com/en/guide/routing.html
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
  - verifyAccessToken injects `req.me`
  - `req.me` contains the authenticated user
*/
import authActions from "../auth/authActions";

/*
  userActions:
  - Thin controllers
  - One action per route
*/
import userActions from "./userActions";

/*
  userValidator:
  - Validates request payloads
  - Prevents invalid data from reaching actions
*/
import userValidator from "./userValidator";

/* ************************************************************************ */
/* Route constants                                                          */
/* ************************************************************************ */

/*
  Paths are declared once to:
  - Avoid duplication
  - Make refactors trivial
*/
const ME_PATH = "/api/users/me";

/* ************************************************************************ */
/* Authenticated routes                                                     */
/* ************************************************************************ */

/*
  User-specific routes.
  - Authentication is enforced
  - Users can only access their own data
*/
router
  .route(ME_PATH)
  .all(authActions.verifyAccessToken)
  .get(userActions.readMe)
  .put(userValidator.validate, userActions.editMe)
  .delete(userActions.destroyMe);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
