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
  const user = await userRepository.read(+req.params.userId);

  if (user == null) {
    res.sendStatus(404);
  } else {
    req.user = user;

    next();
  }
};

export default { convert };
