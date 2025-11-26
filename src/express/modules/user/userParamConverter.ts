import type { RequestParamHandler } from "express";

import userRepository from "./userRepository";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

const convert: RequestParamHandler = async (req, res, next, userId) => {
  const user = await userRepository.read(+userId);

  if (user == null) {
    res.sendStatus(req.method === "DELETE" ? 204 : 404);
  } else {
    req.user = user;

    next();
  }
};

export default { convert };
