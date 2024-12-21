import type { RequestHandler } from "express";

const items: Item[] = [
  { id: 1, title: "Stuff" },
  { id: 2, title: "Doodads" },
];

const browse: RequestHandler = (_req, res, _next) => {
  res.json(items);
};

export default { browse };
