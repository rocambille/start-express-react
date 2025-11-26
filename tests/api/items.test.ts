import express, { type ErrorRequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import supertest from "supertest";
import routes from "../../src/express/routes";
import { mockDatabaseClient, mockedData, mockedInsertId } from "./utils";

const app = express();

app.use(routes);

const logErrors: ErrorRequestHandler = (err, req, _res, next) => {
  console.error(err);
  console.error("on req:", req.method, req.path);

  next(err);
};

app.use(logErrors);

beforeEach(() => {
  mockDatabaseClient();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/items", () => {
  it("should fetch items successfully", async () => {
    const response = await supertest(app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.item);
  });
});
describe("GET /api/items/:id", () => {
  it("should fetch a single item successfully", async () => {
    const response = await supertest(app).get(
      `/api/items/${mockedData.item[0].id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.item[0]);
  });
  it("should fail on invalid id", async () => {
    const response = await supertest(app).get("/api/items/0");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});
describe("POST /api/items", () => {
  it("should add a new item successfully", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.user[0].id.toString(),
        }) as JwtPayload,
    );

    const response = await await supertest(app)
      .post("/api/items")
      .send({ title: "foo" })
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ insertId: mockedInsertId });
  });
  it("should fail on invalid request body", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.user[0].id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .post("/api/items")
      .send({})
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });
  it("should fail without access token", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.user[0].id.toString(),
        }) as JwtPayload,
    );

    const response = await await supertest(app)
      .post("/api/items")
      .send({ title: "foo" });

    expect(response.status).toBe(403);
  });
});
describe("PUT /api/items/:id", () => {
  it("should update an existing item successfully", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({ title: "foo" })
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail on invalid request body", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({})
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });
  it("should fail on invalid id", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .put("/api/items/0")
      .send({ title: "foo" })
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
  it("should fail without access token", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({ title: "foo" });

    expect(response.status).toBe(403);
  });
});
describe("DELETE /api/items/:id", () => {
  it("should delete an existing item successfully", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .delete(`/api/items/${mockedData.item[0].id}`)
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should not fail on invalid id", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app)
      .delete("/api/items/0")
      .set("Cookie", ["auth=foo"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail without access token", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(
      () =>
        ({
          sub: mockedData.item[0].user_id.toString(),
        }) as JwtPayload,
    );

    const response = await supertest(app).delete(
      `/api/items/${mockedData.item[0].id}`,
    );

    expect(response.status).toBe(403);
  });
});
