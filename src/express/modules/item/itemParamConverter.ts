import type { RequestParamHandler } from "express";

import itemRepository from "./itemRepository";

declare global {
  namespace Express {
    interface Request {
      item: Item;
    }
  }
}

const convert: RequestParamHandler = async (req, res, next, id) => {
  const item = await itemRepository.read(+id);

  if (item == null) {
    res.sendStatus(req.method === "DELETE" ? 204 : 404);
  } else {
    req.item = item;

    next();
  }
};

export default { convert };
