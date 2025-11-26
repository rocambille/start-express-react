import { Router } from "express";

const router = Router();

/* ************************************************************************ */

import authActions from "./authActions";

/* ************************************************************************ */

router
  .route("/api/access-tokens")
  .post(authActions.createAccessToken)
  .delete(authActions.destroyAccessToken);

router.get("/api/me", authActions.verifyAccessToken, authActions.readMe);

/* ************************************************************************ */

export default router;
