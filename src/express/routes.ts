/*
  Purpose:
  Central HTTP routing entry point for the Express API.

  Responsibilities:
  - Register global middlewares (cookies, CSRF protection, JSON parsing)
  - Expose a minimal health / sanity endpoint
  - Compose feature modules (auth, items, users)

  Design notes:
  - This file contains no business logic
  - Each feature lives in its own isolated module
  - Middleware order is explicit and intentional

  Related docs:
  - https://expressjs.com/en/guide/routing.html
  - https://expressjs.com/en/guide/using-middleware.html
*/

/* ************************************************************************ */
/* Router initialization                                                    */
/* ************************************************************************ */

import { Router } from "express";

/*
  A single root router is used for the entire API.
  Feature modules will attach their own sub-routes to it.
*/
const router = Router();

/* ************************************************************************ */
/* Global middlewares                                                       */
/* ************************************************************************ */

import cookieParser from "cookie-parser";
import { json } from "express";

import { csrf } from "./helpers/csrf";

/*
  Middleware order matters:

  1. cookieParser()
     - Parses cookies into req.cookies
     - Required for authentication and CSRF validation

  2. csrf()
     - Validates double-submit CSRF tokens on mutative requests
     - Stateless, cookie + header comparison only

  3. json()
     - Parses application/json request bodies
     - Must run after CSRF checks to avoid unnecessary parsing
*/
router.use(cookieParser(), csrf(), json());

/* ************************************************************************ */
/* Base endpoint                                                            */
/* ************************************************************************ */

/*
  Minimal API sanity check.
  Useful for smoke tests and quick validation that the server is reachable.

  GET:
  - Returns a JSON payload to confirm the API is alive

  POST:
  - Echoes the request body to validate CSRF protection is working
  - Useful for front-end integration testing
*/
router.get("/api/health", (_req, res) => {
  res.json({ hello: "world" });
});

router.post("/api/health", (req, res) => {
  res.json(req.body);
});

router.delete("/api/health", (_req, res) => {
  res.sendStatus(204);
});

/* ************************************************************************ */
/* API modules                                                       */
/* ************************************************************************ */

/*
  The order does not matter as long as routes do not conflict.
*/

import authRoutes from "./modules/auth/authRoutes";

router.use(authRoutes);

import itemRoutes from "./modules/item/itemRoutes";

router.use(itemRoutes);

import userRoutes from "./modules/user/userRoutes";

router.use(userRoutes);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default router;
