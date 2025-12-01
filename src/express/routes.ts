import express, { Router } from "express";

const router = Router().use(express.json());

const importAndUse = async (path: string) =>
  router.use((await import(path)).default);

/* ************************************************************************ */

router.get("/api", (_req, res) => {
  res.send("hello, world!");
});

await importAndUse("./modules/auth/authRoutes");
await importAndUse("./modules/item/itemRoutes");
await importAndUse("./modules/user/userRoutes");

/* ************************************************************************ */

export default router;
