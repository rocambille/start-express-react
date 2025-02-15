import cookieParser from "cookie-parser";
import express, { Router } from "express";

const router = Router().use(express.json()).use(cookieParser());

/* ************************************************************************ */

import authActions from "./modules/auth/authActions";
import itemActions from "./modules/item/itemActions";
import userActions from "./modules/user/userActions";

/* ************************************************************************ */

router.post("/api/access-token", authActions.createAccessToken);
router.delete("/api/access-token", authActions.destroyAccessToken);

/* ************************************************************************ */

router.get("/api/items", itemActions.browse);
router.get("/api/items/:id", itemActions.read);

/* ************************************************************************ */

router.get("/api/users", userActions.browse);
router.get("/api/users/:id", userActions.read);
router.post(
  "/api/users",
  userActions.validate,
  authActions.hashPassword,
  authActions.createUserAndAccessToken,
);

/* ************************************************************************ */

router.use("/api", authActions.verifyAccessToken); // Authentication Wall

/* ************************************************************************ */

router.post("/api/items", itemActions.validate, itemActions.add);
router.put("/api/items/:id", itemActions.validate, itemActions.edit);
router.delete("/api/items/:id", itemActions.destroy);

/* ************************************************************************ */

router.put(
  "/api/users/:id",
  userActions.validate,
  authActions.hashPassword,
  userActions.edit,
);
router.delete("/api/users/:id", userActions.destroy);

/* ************************************************************************ */

export default router;
