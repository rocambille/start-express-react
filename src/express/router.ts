import express, { Router } from "express";

const router = Router().use(express.json());

import itemActions from "./modules/item/itemActions";

router.get("/api/items", itemActions.browse);
router.get("/api/items/:id", itemActions.read);
router.post("/api/items", itemActions.add);
router.put("/api/items/:id", itemActions.edit);
router.delete("/api/items/:id", itemActions.destroy);

export default router;
