/*
  Purpose:
  Routes related to "auth" actions.

  This file defines:
  - Magic link endpoints
  - Authenticated "me" endpoint

  Guiding principles:
  - Magic link access is public
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

router.post("/api/auth/magic-link", authActions.sendMagicLink);
router.post("/api/auth/verify", authActions.verifyMagicLink);
router.post("/api/auth/logout", authActions.destroyAccessToken);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
