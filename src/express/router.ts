import express from "express";

const router = express.Router();

import itemActions from "./modules/item/itemActions";

router.get("/api/items", itemActions.browse);

export default router;
