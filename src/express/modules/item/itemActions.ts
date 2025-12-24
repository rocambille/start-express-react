/*
  Purpose:
  Define HTTP request handlers for Item-related operations.

  This file:
  - Translates HTTP requests into repository calls
  - Shapes HTTP responses (status codes and payloads)
  - Assumes all upstream guarantees are already satisfied

  What this file intentionally does NOT do:
  - No authentication (handled by auth middleware)
  - No authorization (handled by route-level checks)
  - No input validation (handled by validators)
  - No database logic (handled by repositories)

  Design notes:
  - Each handler maps closely to a single use case
  - Side effects are explicit and minimal
  - Handlers remain thin to keep behavior easy to audit
*/

import type { RequestHandler } from "express";

import itemRepository from "./itemRepository";

/* ************************************************************************ */
/* Handlers                                                                 */
/* ************************************************************************ */

/*
  Browse all items.

  Preconditions:
  - None (public endpoint)

  Response:
  - 200 with an array of items
*/
const browse: RequestHandler = async (_req, res) => {
  const items = await itemRepository.readAll();

  res.json(items);
};

/* ************************************************************************ */

/*
  Read a single item.

  Preconditions:
  - `req.item` has been injected by the param converter

  Response:
  - 200 with the item payload
*/
const read: RequestHandler = (req, res) => {
  res.json(req.item);
};

/* ************************************************************************ */

/*
  Edit an existing item.

  Preconditions:
  - User is authenticated
  - User is authorized to access this item
  - req.body has been validated and sanitized

  Response:
  - 204 No Content on success
*/
const edit: RequestHandler = async (req, res) => {
  await itemRepository.update(req.item.id, req.body);

  res.sendStatus(204);
};

/* ************************************************************************ */

/*
  Create a new item.

  Preconditions:
  - User is authenticated
  - req.body has been validated and enriched with user_id

  Response:
  - 201 Created with the new item's id
*/
const add: RequestHandler = async (req, res) => {
  const insertId = await itemRepository.create(req.body);

  res.status(201).json({ insertId });
};

/* ************************************************************************ */

/*
  Soft-delete an item.

  Preconditions:
  - User is authenticated
  - User is authorized to access this item

  Response:
  - 204 No Content
*/
const destroy: RequestHandler = async (req, res) => {
  await itemRepository.softDelete(req.item.id);

  res.sendStatus(204);
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default {
  browse,
  read,
  edit,
  add,
  destroy,
};
