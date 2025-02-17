import cookieParser from "cookie-parser";
import express, { Router } from "express";

const router = Router().use(express.json()).use(cookieParser());

/* ************************************************************************ */

import authRoutes from "./modules/auth/authRoutes";

router.use(authRoutes);

/* ************************************************************************ */

import itemRoutes from "./modules/item/itemRoutes";

router.use(itemRoutes);

/* ************************************************************************ */

import userRoutes from "./modules/user/userRoutes";

router.use(userRoutes);

/* ************************************************************************ */

export default router;
