import type { RequestHandler } from "express";

// Import access to data
import userRepository from "./userRepository";

// The B of BREAD - Browse (Read All) operation
const browse: RequestHandler = async (_req, res, next) => {
  try {
    // Fetch all users
    const users = await userRepository.readAll();

    // Respond with the users in JSON format
    res.json(users);
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

// The R of BREAD - Read operation
const read: RequestHandler = async (req, res, next) => {
  try {
    // Fetch a specific user based on the provided ID
    const user = await userRepository.read(+req.params.id);

    // If the user is not found, respond with HTTP 404 (Not Found)
    // Otherwise, respond with the user in JSON format
    if (user == null) {
      res.sendStatus(404);
    } else {
      res.json(user);
    }
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

// The E of BREAD - Edit (Update) operation
const edit: RequestHandler = async (req, res, next) => {
  try {
    if (req.params.id !== req.auth.sub) {
      res.sendStatus(403);
      return;
    }

    // Extract the user data from the request body and params
    const newUser = {
      id: +req.params.id,
      email: req.body.email,
      password: req.body.password,
    };

    // Update the user
    const affectedRows = await userRepository.update(newUser);

    // If the user is not found, respond with HTTP 404 (Not Found)
    // Otherwise, respond with HTTP 204 (No Content)
    if (affectedRows === 0) {
      res.sendStatus(404);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    // Pass passwordany errors to the error-handling middleware
    next(err);
  }
};

// The D of BREAD - Destroy (Delete) operation
const destroy: RequestHandler = async (req, res, next) => {
  try {
    if (req.params.id !== req.auth.sub) {
      res.sendStatus(403);
      return;
    }

    // Delete a specific user based on the provided ID
    await userRepository.delete(+req.params.id);

    // Always respond with HTTP 204 (No Content)
    res.sendStatus(204);
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

// The V - Validate operation
const validate: RequestHandler = async (req, res, next) => {
  const errors: ValidationError[] = [];

  const { email, password } = req.body;

  if (email == null) {
    errors.push({ field: "email", message: "The field is required" });
  } else if (email.length > 255) {
    errors.push({
      field: "email",
      message: "Should contain less than 255 characters",
    });
  }

  if (password == null) {
    errors.push({ field: "password", message: "The field is required" });
  } else if (password.length > 255) {
    errors.push({
      field: "password",
      message: "Should contain less than 255 characters",
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
  destroy,
  validate,
};
