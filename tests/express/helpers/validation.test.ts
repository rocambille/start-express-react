/*
  Purpose:
  Unit tests for createValidator on every target, with a real Express 5
  request (req.query is a getter without setter there).
*/

import express from "express";
import supertest from "supertest";
import { z } from "zod";

import { createValidator } from "../../../src/express/helpers/validation";

const app = express();

app.use(express.json());

app.get(
  "/search",
  createValidator({
    query: z.object({
      q: z.string().trim().toLowerCase(),
      page: z.coerce.number().int().min(1).default(1),
    }),
  }),
  (req, res) => {
    res.json(req.query);
  },
);

app.post(
  "/items/:id",
  createValidator({
    params: z.object({ id: z.coerce.number().int() }),
    body: z.object({ title: z.string().min(1) }),
  }),
  (req, res) => {
    res.json({ params: req.params, body: req.body });
  },
);

app.use(((err, _req, res, _next) => {
  res.status(500).json({ message: String(err) });
}) as express.ErrorRequestHandler);

const api = supertest(app);

describe("createValidator", () => {
  it("replaces the query with the parsed one", async () => {
    const response = await api.get("/search?q=%20Akro%20");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ q: "akro", page: 1 });
  });

  it("rejects an invalid query", async () => {
    const response = await api.get("/search?q=akro&page=0");

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.any(Array));
  });

  it("replaces params and body with the parsed ones", async () => {
    const response = await api.post("/items/42").send({ title: "Stuff" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      params: { id: 42 },
      body: { title: "Stuff" },
    });
  });
});
