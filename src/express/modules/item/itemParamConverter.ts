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
  try {
    // Fetch a specific item based on the provided ID
    const item = await itemRepository.read(+req.params.itemId);

    // If the item is not found, respond with HTTP 404 (Not Found)
    // Otherwise, respond with the item in JSON format
    if (item == null) {
      res.sendStatus(404);
    } else {
      req.item = item;

      next();
    }
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

export default { convert };
