import { type RequestHandler, Router } from "express";

const router = Router();

/* ************************************************************************ */

import itemActions from "./itemActions";
import itemParamConverter from "./itemParamConverter";
import itemValidator from "./itemValidator";

import authActions from "../auth/authActions";

/* ************************************************************************ */

router.param("itemId", itemParamConverter.convert);

/* ************************************************************************ */

const checkAccess: RequestHandler = (req, res, next) => {
  if (req.item.user_id === Number(req.auth.sub)) {
    next();
  } else {
    res.sendStatus(403);
  }
};

/* ************************************************************************ */

router
  .route("/api/items")
  .get(itemActions.browse)
  .all(authActions.verifyAccessToken) /* auth wall */
  .post(itemValidator.validate, itemActions.add);

/* ************************************************************************ */

router
  .route("/api/items/:itemId")
  .get(itemActions.read)
  .all(authActions.verifyAccessToken, checkAccess) /* auth wall */
  .put(itemValidator.validate, itemActions.edit)
  .delete(itemActions.destroy);

/* ************************************************************************ */

export default router;
