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

describe("GET /api/users", () => {
  it("should fetch users successfully", async () => {
    const response = await api.get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.user);
  });
});
describe("GET /api/users/:id", () => {
  it("should fetch a single user successfully", async () => {
    const response = await api.get(`/api/users/${mockedData.user[0].id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.user[0]);
  });
  it("should fail on invalid id", async () => {
    const response = await api.get("/api/users/0");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
});
describe("POST /api/users", () => {
  it("should add a new user successfully", async () => {
    const response = await api.post("/api/users").send({
      email: "foo@mail.com",
      password: "123456",
      confirmPassword: "123456",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ insertId: mockedInsertId });
  });
  it("should fail on invalid request body", async () => {
    const response = await api.post("/api/users").send({});

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(3);
  });
});
describe("PUT /api/users/:id", () => {
  it("should update an existing user successfully", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .put(`/api/users/${mockedData.user[0].id}`)
      .send({
        email: "foo@mail.com",
        password: "123456",
        confirmPassword: "123456",
      })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail on invalid authorization", async () => {
    mockJwtVerify(mockedInsertId.toString());

    const response = await api
      .put(`/api/users/${mockedData.user[0].id}`)
      .send({
        email: "foo@mail.com",
        password: "123456",
        confirmPassword: "123456",
      })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(403);
  });
  it("should fail on invalid request body", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .put(`/api/users/${mockedData.user[0].id}`)
      .send({})
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(400);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(3);
  });
  it("should fail on invalid id", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .put("/api/users/0")
      .send({
        email: "foo@mail.com",
        password: "123456",
        confirmPassword: "123456",
      })
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({});
  });
  it("should fail without access token", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api.put(`/api/users/${mockedData.user[0].id}`).send({
      email: "foo@mail.com",
      password: "123456",
      confirmPassword: "123456",
    });

    expect(response.status).toBe(403);
  });
});
describe("DELETE /api/users/:id", () => {
  it("should delete an existing user successfully", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .delete(`/api/users/${mockedData.user[0].id}`)
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail on invalid authorization", async () => {
    mockJwtVerify(mockedInsertId.toString());

    const response = await api
      .delete(`/api/users/${mockedData.user[0].id}`)
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(403);
  });
  it("should not fail on invalid id", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api
      .delete("/api/users/0")
      .set("Cookie", ["auth=token"]);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });
  it("should fail without access token", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api.delete(`/api/users/${mockedData.user[0].id}`);

    // Assertions
    expect(response.status).toBe(403);
  });
});
