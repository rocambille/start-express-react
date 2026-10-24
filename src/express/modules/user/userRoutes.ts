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

import express, { Router } from "express";

const router = Router();

/* ************************************************************************ */
/* Dependencies                                                             */
/* ************************************************************************ */

/*
  avatarUploader:
  - Handles avatar file uploads
  - Validates file type and size
*/
import { createUploader, UPLOADS_DIR } from "../../helpers/upload";
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
const UPLOADS_PATH = "/uploads";

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

/*
  Uploaded files (avatars) are served to authenticated users only (401
  otherwise): user content is not public by default.

  Declared here, with the uploads they serve: make:purge removes them
  together with the user module.
*/
router.use(
  UPLOADS_PATH,
  authActions.verifyAccessToken,
  express.static(UPLOADS_DIR),
);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
