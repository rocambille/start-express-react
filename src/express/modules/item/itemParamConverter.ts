import type { RequestHandler } from "express";

import itemRepository from "./itemRepository";

declare global {
  namespace Express {
    interface Request {
      item: Item;
    }
  }
}

const convert: RequestHandler = async (req, res, next) => {
  const item = await itemRepository.read(+req.params.itemId);

  if (item == null) {
    res.sendStatus(req.method === "DELETE" ? 204 : 404);
  } else {
    req.item = item;

    next();
  }
};

export default { convert };
