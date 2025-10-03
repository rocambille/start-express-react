import { type RequestHandler, Router } from "express";

const router = Router();

/* ************************************************************************ */

import authActions from "../auth/authActions";
import itemActions from "./itemActions";
import itemParamConverter from "./itemParamConverter";
import itemValidator from "./itemValidator";

/* ************************************************************************ */

const BASE_PATH = "/api/items";
const ITEM_PATH = "/api/items/:itemId";

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

router.get(BASE_PATH, itemActions.browse);
router.get(ITEM_PATH, itemActions.read);

/* ************************************************************************ */

router.use(BASE_PATH, authActions.verifyAccessToken); // Authentication Wall

/* ************************************************************************ */

router.post(BASE_PATH, itemValidator.validate, itemActions.add);

router
  .route(ITEM_PATH)
  .all(checkAccess)
  .put(itemValidator.validate, itemActions.edit)
  .delete(itemActions.destroy);

/* ************************************************************************ */

export default router;
