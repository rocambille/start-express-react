import "dotenv/config";

import express, { type ErrorRequestHandler } from "express";
import jwt from "jsonwebtoken";
import supertest from "supertest";

import routes from "../../src/express/routes";

import databaseClient, {
  type Result,
  type Rows,
} from "../../src/database/client";

const app = express();
app.use(routes);

const logErrors: ErrorRequestHandler = (err, req, _res, next) => {
  console.error(err);
  console.error("on req:", req.method, req.path);

  next(err);
};

app.use(logErrors);

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /api/items", () => {
  it("should fetch items successfully", async () => {
    // Mock empty rows returned from the database
    const rows = [] as Rows;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [rows, []]);

    // Send a GET request to the /api/items endpoint
    const response = await supertest(app).get("/api/items");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(rows);
  });
});

describe("GET /api/items/:id", () => {
  it("should fetch a single item successfully", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [rows, []]);

    // Send a GET request to the /api/items/:id endpoint
    const response = await supertest(app).get("/api/items/1");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(rows[0]);
  });

  it("should fail on invalid id", async () => {
    // Mock empty rows returned from the database
    const rows = [] as Rows;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [rows, []]);

    // Send a GET request to the /api/items/:id endpoint with an invalid ID
    const response = await supertest(app).get("/api/items/0");

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});

describe("POST /api/items", () => {
  it("should add a new item successfully", async () => {
    // Mock result of the database query
    const result = { insertId: 1 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake item data
    const fakeItem = { title: "foo" };

    // Send a POST request to the /api/items endpoint with a test item
    const response = await await supertest(app)
      .post("/api/items")
      .send(fakeItem)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.insertId).toBe(result.insertId);
  });

  it("should fail on invalid request body", async () => {
    // Mock result of the database query
    const result = { insertId: 1 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake empty item
    const fakeItem = {};

    // Send a POST request to the /api/items endpoint with a test item
    const response = await supertest(app)
      .post("/api/items")
      .send(fakeItem)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });

  it("should fail without access token", async () => {
    // Send a POST request to the /api/items endpoint
    const response = await supertest(app).post("/api/items");

    // Assertions
    expect(response.status).toBe(403);
  });
});

describe("PUT /api/items/:id", () => {
  it("should update an existing item successfully", async () => {
    // Mock rows returned from the database
    const rows = [{ user_id: 0 }] as Item[] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async (sql) =>
        (sql as unknown as string).includes("select")
          ? [rows, []]
          : [result, []],
      );

    // Fake item data
    const fakeItem = { title: "foo" };

    // Send a PUT request to the /api/items/:id endpoint with a test item
    const response = await supertest(app)
      .put("/api/items/42")
      .send(fakeItem)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should fail on invalid request body", async () => {
    // Mock rows returned from the database
    const rows = [{ user_id: 0 }] as Rows;

    // Mock result of the database update query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Fake empty item
    const fakeItem = {};

    // Send a PUT request to the /api/items/:id endpoint with a test item
    const response = await supertest(app)
      .put("/api/items/42")
      .send(fakeItem)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });

  it("should fail on invalid id", async () => {
    // Mock rows returned from the database
    const rows = [] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 0 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Fake item data
    const fakeItem = { title: "foo" };

    // Send a PUT request to the /api/items/:id endpoint with a test item
    const response = await supertest(app)
      .put("/api/items/43")
      .send(fakeItem)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });

  it("should fail without access token", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [rows, []]);

    // Send a POST request to the /api/items endpoint
    const response = await supertest(app).put("/api/items/42");

    // Assertions
    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/items/:id", () => {
  it("should delete an existing item successfully", async () => {
    // Mock rows returned from the database
    const rows = [{ user_id: 0 }] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Send a DELETE request to the /api/items/:id endpoint
    const response = await supertest(app)
      .delete("/api/items/42")
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should fail on invalid id", async () => {
    // Mock rows returned from the database
    const rows = [] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 0 } as Result;

    // Mock the implementation of the jwt verify method
    jest.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "0" }));

    // Mock the implementation of the database query method
    jest.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Send a DELETE request to the /api/items/:id endpoint
    const response = await supertest(app)
      .delete("/api/items/43")
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });

  it("should fail without access token", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [rows, []]);

    // Send a POST request to the /api/items endpoint
    const response = await supertest(app).delete("/api/items/42");

    // Assertions
    expect(response.status).toBe(403);
  });
});
