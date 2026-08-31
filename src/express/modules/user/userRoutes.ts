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
  avatarUploader:
  - Handles avatar file uploads
  - Validates file type and size
*/
import { createUploader } from "../../helpers/upload";
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
  userValidators:
  - Validates request payloads
  - Prevents invalid data from reaching actions
*/
import userValidators from "./userValidators";

const avatarUploader = createUploader({
  subfolder: "avatars",
  maxSizeBytes: 2 * 1024 * 1024,
});

/* ************************************************************************ */
/* Route constants                                                          */
/* ************************************************************************ */

/*
  Paths are declared once to:
  - Avoid duplication
  - Make refactors trivial
*/
const ME_PATH = "/api/users/me";
const ME_AVATAR_PATH = "/api/users/me/avatar";

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
  .put(userValidators.editMe, userActions.editMe)
  .delete(userActions.destroyMe);

router
  .route(ME_AVATAR_PATH)
  .all(authActions.verifyAccessToken)
  .post(avatarUploader.single("avatar"), userActions.uploadMeAvatar)
  .delete(userActions.deleteMeAvatar);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
