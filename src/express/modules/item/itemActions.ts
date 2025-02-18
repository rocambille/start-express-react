import type { RequestHandler } from "express";

import itemRepository from "./itemRepository";

/* ************************************************************************ */

const browse: RequestHandler = async (_req, res) => {
  const items = await itemRepository.readAll();

  res.json(items);
};

/* ************************************************************************ */

const read: RequestHandler = (req, res) => {
  res.json(req.item);
};

/* ************************************************************************ */

const edit: RequestHandler = async (req, res) => {
  const newItem = {
    id: req.item.id,
    title: req.body.title,
    user_id: Number(req.auth.sub),
  };

  const affectedRows = await itemRepository.update(newItem);

  if (affectedRows === 0) {
    res.sendStatus(404);
  } else {
    res.sendStatus(204);
  }
};

/* ************************************************************************ */

const add: RequestHandler = async (req, res) => {
  const newItem = {
    title: req.body.title,
    user_id: Number(req.auth.sub),
  };

  const insertId = await itemRepository.create(newItem);

  res.status(201).json({ insertId });
};

/* ************************************************************************ */

const destroy: RequestHandler = async (req, res) => {
  await itemRepository.delete(req.item.id);

  res.sendStatus(204);
};

/* ************************************************************************ */

export default {
  browse,
  read,
  edit,
  add,
  destroy,
};
