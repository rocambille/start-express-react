import cookieParser from "cookie-parser";
import { json, Router } from "express";

import { csrf } from "./middlewares";

const router = Router();

router.use(cookieParser(), csrf(), json());

/* ************************************************************************ */

router.get("/api", (_req, res) => {
  res.send("hello, world!");
});

/* ************************************************************************ */

const importAndUse = async (path: string) =>
  router.use((await import(path)).default);

await importAndUse("./modules/auth/authRoutes");
await importAndUse("./modules/item/itemRoutes");
await importAndUse("./modules/user/userRoutes");

/* ************************************************************************ */

export default router;
