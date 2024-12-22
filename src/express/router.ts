import express from "express";

const router = express.Router();
router.use(express.json());

import itemActions from "./modules/item/itemActions";

router.get("/api/items", itemActions.browse);

export default router;
