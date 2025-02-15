import express from "express";
import supertest from "supertest";

import router from "../../src/express/routes";

import databaseClient, {
  type Result,
  type Rows,
} from "../../src/database/client";

const app = express();
app.use(router);

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

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake item data
    const fakeItem = { title: "foo", user_id: 0 };

    // Send a POST request to the /api/items endpoint with a test item
    const response = await supertest(app).post("/api/items").send(fakeItem);

    // Assertions
    expect(response.status).toBe(201);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.insertId).toBe(result.insertId);
  });

  it("should fail on invalid request body", async () => {
    // Mock result of the database query
    const result = { insertId: 1 } as Result;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake item data with missing user_id
    const fakeItem = { title: "foo" };

    // Send a POST request to the /api/items endpoint with a test item
    const response = await supertest(app).post("/api/items").send(fakeItem);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.validationErrors).toBeInstanceOf(Array);
    expect(
      response.body.validationErrors.every(
        (validationError: ValidationError) =>
          typeof validationError.field === "string" &&
          typeof validationError.message === "string",
      ),
    ).toEqual(true);
  });
});

describe("PUT /api/items/:id", () => {
  it("should update an existing item successfully", async () => {
    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake item data
    const fakeItem = { title: "foo", user_id: 0 };

    // Send a PUT request to the /api/items/:id endpoint with a test item
    const response = await supertest(app).put("/api/items/42").send(fakeItem);

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should fail on invalid request body", async () => {
    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake item data with missing user_id
    const fakeItem = { title: "foo" };

    // Send a PUT request to the /api/items/:id endpoint with a test item
    const response = await supertest(app).put("/api/items/42").send(fakeItem);

    // Assertions
    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.validationErrors).toBeInstanceOf(Array);
    expect(
      response.body.validationErrors.every(
        (validationError: ValidationError) =>
          typeof validationError.field === "string" &&
          typeof validationError.message === "string",
      ),
    ).toEqual(true);
  });

  it("should fail on invalid id", async () => {
    // Mock result of the database query
    const result = { affectedRows: 0 } as Result;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Fake item data with missing user_id
    const fakeItem = { title: "foo", user_id: 0 };

    // Send a PUT request to the /api/items/:id endpoint with a test item
    const response = await supertest(app).put("/api/items/43").send(fakeItem);

    // Assertions
    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});

describe("DELETE /api/items/:id", () => {
  it("should delete an existing item successfully", async () => {
    // Mock result of the database query
    const result = { affectedRows: 1 } as Result;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Send a DELETE request to the /api/items/:id endpoint
    const response = await supertest(app).delete("/api/items/42");

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it("should success even on invalid id", async () => {
    // Mock result of the database query
    const result = { affectedRows: 0 } as Result;

    // Mock the implementation of the database query method
    jest
      .spyOn(databaseClient, "query")
      .mockImplementation(async () => [result, []]);

    // Send a DELETE request to the /api/items/:id endpoint
    const response = await supertest(app).delete("/api/items/43");

    // Assertions
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
});
