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
  await itemRepository.update(req.item.id, req.body);

  res.sendStatus(204);
};

/* ************************************************************************ */

const add: RequestHandler = async (req, res) => {
  const insertId = await itemRepository.create(req.body);

  res.status(201).json({ insertId });
};

/* ************************************************************************ */

const destroy: RequestHandler = async (req, res) => {
  await itemRepository.softDelete(req.item.id);

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
