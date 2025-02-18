import { type RequestHandler, Router } from "express";

const router = Router();

/* ************************************************************************ */

import userActions from "./userActions";
import userParamConverter from "./userParamConverter";
import userValidator from "./userValidator";

import authActions from "../auth/authActions";

/* ************************************************************************ */

const BASE_PATH = "/api/users";
const USER_PATH = "/api/users/:userId";

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
  .route(BASE_PATH)
  .get(userActions.browse)
  .post(
    userValidator.validate,
    authActions.hashPassword,
    authActions.createUserAndAccessToken,
  );

router.get(USER_PATH, userActions.read);

/* ************************************************************************ */

router.use(authActions.verifyAccessToken); // Authentication Wall

/* ************************************************************************ */

router
  .route(USER_PATH)
  .all(checkAccess)
  .put(userValidator.validate, authActions.hashPassword, userActions.edit)
  .delete(userActions.destroy);

/* ************************************************************************ */

export default router;
