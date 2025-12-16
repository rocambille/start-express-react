import {
  api,
  mockDatabaseClient,
  mockedData,
  mockedInsertId,
  mockJwtVerify,
  resetMockData,
  using,
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

    const response = await using(
      api.post("/api/items").send({ title: "foo" }),
      { withCsrf: true, withAuth: true },
    );

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ insertId: mockedInsertId });
  });
  it("should fail without CSRF token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.user[0].id.toString());

    const response = await using(
      api.post("/api/items").send({ title: "foo" }),
      { withCsrf: false, withAuth: true },
    );

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail without access token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.user[0].id.toString());

    const response = await using(
      api.post("/api/items").send({ title: "foo" }),
      { withCsrf: true, withAuth: false },
    );

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail on invalid request body", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await using(api.post("/api/items").send({}), {
      withCsrf: true,
      withAuth: true,
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });
});
describe("PUT /api/items/:id", () => {
  it("should update an existing item successfully", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.put(`/api/items/${mockedData.item[0].id}`).send({ title: "foo" }),
      { withCsrf: true, withAuth: true },
    );

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail without CSRF token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.put(`/api/items/${mockedData.item[0].id}`).send({ title: "foo" }),
      { withCsrf: false, withAuth: true },
    );

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail without access token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.put(`/api/items/${mockedData.item[0].id}`).send({ title: "foo" }),
      { withCsrf: true, withAuth: false },
    );

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail on invalid authorization", async () => {
    const jwtVerify = mockJwtVerify(mockedInsertId.toString());

    const response = await using(
      api.put(`/api/items/${mockedData.item[0].id}`).send({ title: "foo" }),
      { withCsrf: true, withAuth: true },
    );

    expect(jwtVerify).toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
  it("should fail on invalid request body", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.put(`/api/items/${mockedData.item[0].id}`).send({}),
      { withCsrf: true, withAuth: true },
    );

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });
  it("should fail on invalid id", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.put("/api/items/0").send({ title: "foo" }),
      { withCsrf: true, withAuth: true },
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});
describe("DELETE /api/items/:id", () => {
  it("should delete an existing item successfully", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.delete(`/api/items/${mockedData.item[0].id}`),
      { withCsrf: true, withAuth: true },
    );

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail without CSRF token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.delete(`/api/items/${mockedData.item[0].id}`),
      { withCsrf: false, withAuth: true },
    );

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail without access token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(
      api.delete(`/api/items/${mockedData.item[0].id}`),
      { withCsrf: true, withAuth: false },
    );

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail on invalid authorization", async () => {
    const jwtVerify = mockJwtVerify(mockedInsertId.toString());

    const response = await using(
      api.delete(`/api/items/${mockedData.item[0].id}`),
      { withCsrf: true, withAuth: true },
    );

    expect(jwtVerify).toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
  it("should not fail on invalid id", async () => {
    mockJwtVerify(mockedData.item[0].user_id.toString());

    const response = await using(api.delete("/api/items/0"), {
      withCsrf: true,
      withAuth: true,
    });

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
});
