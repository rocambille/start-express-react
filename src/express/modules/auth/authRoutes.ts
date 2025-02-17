import { Router } from "express";

const router = Router();

/* ************************************************************************ */

import authActions from "./authActions";

/* ************************************************************************ */

router
  .route("/api/access-token")
  .post(authActions.createAccessToken)
  .delete(authActions.destroyAccessToken);

/* ************************************************************************ */

export default router;
