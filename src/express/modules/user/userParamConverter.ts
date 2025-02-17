import type { RequestHandler } from "express";

import userRepository from "./userRepository";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

const convert: RequestHandler = async (req, res, next) => {
  try {
    // Fetch a specific user based on the provided ID
    const user = await userRepository.read(+req.params.userId);

    // If the user is not found, respond with HTTP 404 (Not Found)
    // Otherwise, respond with the user in JSON format
    if (user == null) {
      res.sendStatus(404);
    } else {
      req.user = user;

      next();
    }
  } catch (err) {
    // Pass any errors to the error-handling middleware
    next(err);
  }
};

export default { convert };
