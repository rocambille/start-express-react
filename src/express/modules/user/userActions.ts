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

import { deleteUploadedFile } from "../../helpers/upload";
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
  userRepository.update(req.body);

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

/*
  Upload avatar image for the currently authenticated user.

  Preconditions:
  - User is authenticated
  - Multer middleware has processed and attached req.file
*/
const uploadMeAvatar: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file attached" });
    return;
  }

  const oldAvatarUrl = req.me.avatar_url;
  const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

  userRepository.updateAvatar(req.me.id, newAvatarUrl);
  deleteUploadedFile(oldAvatarUrl);

  res.status(201).json({ avatar_url: newAvatarUrl });
};

/* ************************************************************************ */

/*
  Delete avatar image for the currently authenticated user.

  Preconditions:
  - User is authenticated
*/
const deleteMeAvatar: RequestHandler = (req, res) => {
  const oldAvatarUrl = req.me.avatar_url;

  userRepository.updateAvatar(req.me.id, null);
  deleteUploadedFile(oldAvatarUrl);

  res.sendStatus(204);
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default {
  readMe,
  editMe,
  destroyMe,
  uploadMeAvatar,
  deleteMeAvatar,
};
