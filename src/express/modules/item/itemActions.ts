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
  Browse items by range.

  Preconditions:
  - None (public endpoint)
  - A valid `Range: items=start-end` header must be present

  Response:
  - 206 Partial Content with Content-Range header and the requested slice
  - 400 if no Range header or format is invalid
  - 416 Range Not Satisfiable if start >= total
*/
const browse: RequestHandler = (req, res) => {
  // This handler implements HTTP range semantics (single range only).
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests

  res.setHeader("Accept-Ranges", "items");

  // Parse the Range header
  // Example: "Range: items=0-9"

  const match = req.headers.range?.match(/^items=(\d+)-(\d+)$/);

  if (!match) {
    res.sendStatus(400);
    return;
  }

  const [start, end] = [Number(match[1]), Number(match[2])];

  // Check if the range is valid

  const total = itemRepository.count();

  if (start < 0 || start > end || start >= total) {
    res.setHeader("Content-Range", `items */${total}`);
    res.sendStatus(416);

    return;
  }

  // Fetch items for the specified range

  const limit = end - start + 1;
  const items = itemRepository.findAll(limit, start);

  // Set the Content-Range header and send the range of items (206)

  res.setHeader(
    "Content-Range",
    `items ${start}-${Math.min(end, total - 1)}/${total}`,
  );
  res.status(206).json(items);
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
const edit: RequestHandler = (req, res) => {
  itemRepository.update(req.body);

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
const add: RequestHandler = (req, res) => {
  const insertId = itemRepository.create(req.body);

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
const destroy: RequestHandler = (req, res) => {
  itemRepository.softDelete(req.item.id);

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
