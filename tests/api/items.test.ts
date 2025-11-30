import {
  api,
  mockDatabaseClient,
  mockedData,
  mockedInsertId,
  mockJwtVerify,
  resetMockData,
} from "./utils";

beforeEach(() => {
  resetMockData();
  mockDatabaseClient();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/items", () => {
  it("should fetch items successfully", async () => {
    const response = await api.get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.item);
  });
});
describe("GET /api/items/:id", () => {
  it("should fetch a single item successfully", async () => {
    const response = await api.get(`/api/items/${mockedData.item[0].id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.item[0]);
  });
  it("should fail on invalid id", async () => {
    const response = await api.get("/api/items/0");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});
describe("POST /api/items", () => {
  it("should add a new item successfully", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .post("/api/items")
      .send({ title: "foo" })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ insertId: mockedInsertId });
  });
  it("should fail on invalid request body", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .post("/api/items")
      .send({})
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });
  it("should fail without access token", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api.post("/api/items").send({ title: "foo" });

    expect(response.status).toBe(403);
  });
});
describe("PUT /api/items/:id", () => {
  it("should update an existing item successfully", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({ title: "foo" })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail on invalid authorization", async () => {
    mockJwtVerify(mockedInsertId.toString());

    const response = await api
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({ title: "foo" })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(403);
  });
  it("should fail on invalid request body", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({})
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });
  it("should fail on invalid id", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api
      .put("/api/items/0")
      .send({ title: "foo" })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
  it("should fail without access token", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api
      .put(`/api/items/${mockedData.item[0].id}`)
      .send({ title: "foo" });

    expect(response.status).toBe(403);
  });
});
describe("DELETE /api/items/:id", () => {
  it("should delete an existing item successfully", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api
      .delete(`/api/items/${mockedData.item[0].id}`)
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail on invalid authorization", async () => {
    mockJwtVerify(mockedInsertId.toString());

    const response = await api
      .delete(`/api/items/${mockedData.item[0].id}`)
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(403);
  });
  it("should not fail on invalid id", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api
      .delete("/api/items/0")
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail without access token", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await api.delete(`/api/items/${mockedData.item[0].id}`);

    expect(response.status).toBe(403);
  });
});
