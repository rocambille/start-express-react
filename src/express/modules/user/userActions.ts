import type { RequestHandler } from "express";

import userRepository from "./userRepository";

/* ************************************************************************ */

const browse: RequestHandler = async (_req, res) => {
  const users = await userRepository.readAll();

  res.json(users);
};

/* ************************************************************************ */

const read: RequestHandler = async (req, res) => {
  res.json(req.user);
};

/* ************************************************************************ */

const edit: RequestHandler = async (req, res) => {
  const newUser = {
    id: req.user.id,
    email: req.body.email,
    password: req.body.password,
  };

  const affectedRows = await userRepository.update(newUser);

  if (affectedRows === 0) {
    res.sendStatus(404);
  } else {
    res.sendStatus(204);
  }
};

/* ************************************************************************ */

const destroy: RequestHandler = async (req, res) => {
  await userRepository.delete(req.user.id);

  res.sendStatus(204);
};

/* ************************************************************************ */

export default {
  browse,
  read,
  edit,
  destroy,
};
