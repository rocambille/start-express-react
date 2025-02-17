import type { RequestHandler } from "express";

// Import access to data
import itemRepository from "./itemRepository";

declare global {
  namespace Express {
    interface Request {
      item: Item;
    }
  }
}

// The B of BREAD - Browse (Read All) operation
const browse: RequestHandler = async (_req, res, next) => {
  try {
    // Fetch all items
    const items = await itemRepository.readAll();

    // Respond with the items in JSON format
    res.json(items);
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

// The R of BREAD - Read operation
const readOnly: RequestHandler = async (req, res, next) => {
  try {
    // Fetch a specific item based on the provided ID
    const item = await itemRepository.read(+req.params.id);

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

const read: RequestHandler[] = [
  readOnly,
  (req, res) => {
    res.json(req.item);
  },
];

// The E of BREAD - Edit (Update) operation
const edit: RequestHandler[] = [
  readOnly,
  async (req, res, next) => {
    try {
      // Extract the item data from the request body and params
      const newItem = {
        id: +req.params.id,
        title: req.body.title,
        user_id: Number(req.auth.sub),
      };

      if (req.item.user_id !== newItem.user_id) {
        res.sendStatus(403);
        return;
      }

      // Update the item
      const affectedRows = await itemRepository.update(newItem);

      // If the item is not found, respond with HTTP 404 (Not Found)
      // Otherwise, respond with HTTP 204 (No Content)
      if (affectedRows === 0) {
        res.sendStatus(404);
      } else {
        res.sendStatus(204);
      }
    } catch (err) {
      // Pass any errors to the error-handling middleware
      next(err);
    }
  },
];

// The A of BREAD - Add (Create) operation
const add: RequestHandler = async (req, res, next) => {
  try {
    // Extract the item data from the request body
    const newItem = {
      title: req.body.title,
      user_id: Number(req.auth.sub),
    };

    // Create the item
    const insertId = await itemRepository.create(newItem);

    // Respond with HTTP 201 (Created) and the ID of the newly inserted item
    res.status(201).json({ insertId });
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

// The D of BREAD - Destroy (Delete) operation
const destroy: RequestHandler[] = [
  readOnly,
  async (req, res, next) => {
    try {
      // Extract the item data from the request params
      const oldItem = {
        id: +req.params.id,
        user_id: Number(req.auth.sub),
      };

      if (req.item.user_id !== oldItem.user_id) {
        res.sendStatus(403);
        return;
      }

      // Delete a specific item based on the provided ID
      await itemRepository.delete(oldItem.id);

      // Always respond with HTTP 204 (No Content)
      res.sendStatus(204);
    } catch (err) {
      // Pass any errors to the error-handling middleware
      next(err);
    }
  },
];

// The V - Validate operation
const validate: RequestHandler = async (req, res, next) => {
  const errors: ValidationError[] = [];

  const { title, user_id } = req.body;

  if (title == null) {
    errors.push({ field: "title", message: "The field is required" });
  } else if (title.length > 255) {
    errors.push({
      field: "title",
      message: "Should contain less than 255 characters",
    });
  }

  if (user_id == null) {
    errors.push({ field: "user_id", message: "The field is required" });
  } else if (Number.isNaN(Number(user_id))) {
    errors.push({
      field: "user_id",
      message: "Should be a valid number",
    });
  }

  if (errors.length === 0) {
    next();
  } else {
    res.status(400).json({ validationErrors: errors });
  }
};

export default {
  browse,
  read,
  edit,
  add,
  destroy,
  validate,
};
