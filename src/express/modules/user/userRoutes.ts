import { type RequestHandler, Router } from "express";

const router = Router();

/* ************************************************************************ */

import userActions from "./userActions";
import userParamConverter from "./userParamConverter";
import userValidator from "./userValidator";

import authActions from "../auth/authActions";

/* ************************************************************************ */

router.param("userId", userParamConverter.convert);

/* ************************************************************************ */

const checkAccess: RequestHandler = (req, res, next) => {
  if (req.params.userId === req.auth.sub) {
    next();
  } else {
    res.sendStatus(403);
  }
};

/* ************************************************************************ */

router
  .route("/api/users")
  .get(userActions.browse)
  .post(
    userValidator.validate,
    authActions.hashPassword,
    authActions.createUserAndAccessToken,
  );

/* ************************************************************************ */

router
  .route("/api/users/:userId")
  .get(userActions.read)
  .all(authActions.verifyAccessToken, checkAccess) /* auth wall */
  .put(userValidator.validate, authActions.hashPassword, userActions.edit)
  .delete(userActions.destroy);

/* ************************************************************************ */

export default router;
