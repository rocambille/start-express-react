import argon2 from "argon2";
import jwt from "jsonwebtoken";

import {
  api,
  mockDatabaseClient,
  mockedData,
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

describe("POST /api/access-tokens", () => {
  beforeEach(() => {
    // https://vitest.dev/guide/browser/#spying-on-module-exports
    vi.mock("argon2", { spy: true });
  });
  afterEach(() => {
    // Need a deep restore
    vi.mocked(argon2.verify).mockRestore();
  });
  it("should return auth cookie successfully", async () => {
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const response = await using(
      api
        .post("/api/access-tokens")
        .send({ email: mockedData.user[0].email, password: "whatever" }),
      { withCsrf: true, withAuth: false },
    );

    expect(response.status).toBe(201);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).toMatch(/\bauth=.*;\s+HttpOnly;/i);
  });
  it("should fail without CSRF token", async () => {
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const response = await using(
      api
        .post("/api/access-tokens")
        .send({ email: mockedData.user[0].email, password: "whatever" }),
      { withCsrf: false, withAuth: false },
    );

    expect(argon2.verify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).not.toMatch(/\bauth=.*/i);
  });
  it("should fail on invalid user", async () => {
    const response = await using(
      api
        .post("/api/access-tokens")
        .send({ email: "unknown@mail.com", password: "whatever" }),
      { withCsrf: true, withAuth: false },
    );

    expect(argon2.verify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).not.toMatch(/\bauth=.*/i);
  });
  it("should fail on invalid password", async () => {
    vi.mocked(argon2.verify).mockResolvedValue(false);

    const response = await using(
      api
        .post("/api/access-tokens")
        .send({ email: mockedData.user[0].email, password: "whatever" }),
      { withCsrf: true, withAuth: false },
    );

    expect(argon2.verify).toHaveBeenCalled();
    expect(response.status).toBe(401);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).not.toMatch(/\bauth=.*/i);
  });
});
describe("GET /api/me", () => {
  it("should return the logged user", async () => {
    const jwtVerify = mockJwtVerify(mockedData.user[0].id.toString());

    const response = await using(api.get("/api/me"), {
      withCsrf: false,
      withAuth: true,
    });

    expect(jwtVerify).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.user[0]);
  });
  it("should fail without access token", async () => {
    const jwtVerify = mockJwtVerify(mockedData.user[0].id.toString());

    const response = await using(api.get("/api/me"), {
      withCsrf: false,
      withAuth: false,
    });

    expect(jwtVerify).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
  it("should fail with invalid token", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("invalid token");
    });

    const response = await using(api.get("/api/me"), {
      withCsrf: false,
      withAuth: true,
    });

    expect(response.status).toBe(401);
  });
});
