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
  vi.restoreAllMocks();
});

describe("GET /api/users", () => {
  it("should fetch users successfully", async () => {
    // Mock empty rows returned from the database
    const rows = [] as Rows;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      rows,
      [],
    ]);

    // Send a GET request to the /api/users endpoint
    const response = await supertest(app).get("/api/users");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(rows);
  });
});

describe("GET /api/users/:id", () => {
  it("should fetch a single user successfully", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      rows,
      [],
    ]);

    // Send a GET request to the /api/users/:id endpoint
    const response = await supertest(app).get("/api/users/1");

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(rows[0]);
  });

  it("should fail on invalid id", async () => {
    // Mock empty rows returned from the database
    const rows = [] as Rows;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      rows,
      [],
    ]);

    // Send a GET request to the /api/users/:id endpoint with an invalid ID
    const response = await supertest(app).get("/api/users/0");

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});

describe("POST /api/users", () => {
  it("should add a new user successfully", async () => {
    // Mock result of the database query
    const result = { insertId: 1 } as Result;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      result,
      [],
    ]);

    // Fake user data
    const fakeUser = {
      email: "foo@mail.com",
      password: "123456",
      confirmPassword: "123456",
    };

    // Send a POST request to the /api/users endpoint with a test user
    const response = await supertest(app).post("/api/users").send(fakeUser);

    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.insertId).toBe(result.insertId);
  });

  it("should fail on invalid request body", async () => {
    // Mock result of the database query
    const result = { insertId: 1 } as Result;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      result,
      [],
    ]);

    // Fake empty user
    const fakeUser = {};

    // Send a POST request to the /api/users endpoint with a test user
    const response = await supertest(app).post("/api/users").send(fakeUser);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(3);
  });
});

describe("PUT /api/users/:id", () => {
  it("should update an existing user successfully", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    vi.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "42" }));

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Fake user data
    const fakeUser = {
      email: "foo@mail.com",
      password: "123456",
      confirmPassword: "123456",
    };

    // Send a PUT request to the /api/users/:id endpoint with a test user
    const response = await supertest(app)
      .put("/api/users/42")
      .send(fakeUser)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should fail on invalid request body", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    vi.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "42" }));

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Fake empty user
    const fakeUser = {};

    // Send a PUT request to the /api/users/:id endpoint with a test user
    const response = await supertest(app)
      .put("/api/users/42")
      .send(fakeUser)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(3);
  });

  it("should fail on invalid id", async () => {
    // Mock rows returned from the database
    const rows = [] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 0 } as Result;

    // Mock the implementation of the jwt verify method
    vi.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "43" }));

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Fake user data
    const fakeUser = {
      email: "foo@mail.com",
      password: "123456",
      confirmPassword: "123456",
    };

    // Send a PUT request to the /api/users/:id endpoint with a test user
    const response = await supertest(app)
      .put("/api/users/43")
      .send(fakeUser)
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });

  it("should fail without access token", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      rows,
      [],
    ]);

    // Send a POST request to the /api/users endpoint
    const response = await supertest(app).put("/api/users/42");

    // Assertions
    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/users/:id", () => {
  it("should delete an existing user successfully", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    vi.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "42" }));

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Send a DELETE request to the /api/users/:id endpoint
    const response = await supertest(app)
      .delete("/api/users/42")
      .set("Cookie", ["auth=foo"]);

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should fail on invalid id", async () => {
    // Mock rows returned from the database
    const rows = [] as Rows;

    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the jwt verify method
    vi.spyOn(jwt, "verify").mockImplementation(() => ({ sub: "43" }));

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async (sql) => {
      return (sql as unknown as string).includes("select")
        ? [rows, []]
        : [result, []];
    });

    // Send a DELETE request to the /api/users/:id endpoint
    const response = await supertest(app)
      .delete("/api/users/43")
      .set("Cookie", ["auth=foo"]);

    // Assertions0
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should fail without access token", async () => {
    // Mock rows returned from the database
    const rows = [{}] as Rows;

    // Mock the implementation of the database query method
    vi.spyOn(databaseClient, "query").mockImplementation(async () => [
      rows,
      [],
    ]);

    // Send a POST request to the /api/users endpoint
    const response = await supertest(app).delete("/api/users/42");

    // Assertions
    expect(response.status).toBe(403);
  });
});
