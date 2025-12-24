/*
  Purpose:
  Routes related to "auth" actions.

  This file defines:
  - Login/logout endpoints
  - Authenticated "me" endpoint

  Guiding principles:
  - Login/logout access is public
  - Me access is authenticated

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
  - Thin controllers
  - One action per route
*/
import authActions from "./authActions";

/* ************************************************************************ */
/* Public routes                                                            */
/* ************************************************************************ */

/*
  Public login/logout endpoints.
  No authentication required.
*/
router
  .route("/api/access-tokens")
  .post(authActions.createAccessToken)
  .delete(authActions.destroyAccessToken);

/* ************************************************************************ */
/* Authenticated routes                                                     */
/* ************************************************************************ */

/*
  Get authenticated user.
  - Requires authentication
*/
router.get("/api/me", authActions.verifyAccessToken, authActions.readMe);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
