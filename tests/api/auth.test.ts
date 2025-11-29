import argon2 from "argon2";
import jwt from "jsonwebtoken";

import {
  api,
  mockDatabaseClient,
  mockedData,
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

describe("POST /api/access-tokens", () => {
  it("should return auth cookie successfully", async () => {
    // https://vitest.dev/guide/browser/#spying-on-module-exports
    vi.mock("argon2");
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const response = await api
      .post("/api/access-tokens")
      .send({ email: mockedData.user[0].email, password: "whatever" });

    expect(response.status).toBe(201);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).toMatch(/\bauth=.*;\s+HttpOnly;/i);
  });
  it("should fail on invalid user", async () => {
    const response = await api.post("/api/access-tokens").send({
      email: "unknown@mail.com",
      password: "whatever",
    });

    expect(response.status).toBe(403);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).not.toMatch(/\bauth=.*/i);
  });
  it("should fail on invalid password", async () => {
    vi.mock("argon2", { spy: true });
    vi.mocked(argon2.verify).mockResolvedValue(false);

    const response = await api
      .post("/api/access-tokens")
      .send({ email: mockedData.user[0].email, password: "whatever" });

    expect(response.status).toBe(403);

    const cookie = response.headers["set-cookie"]?.toString() ?? "";

    expect(cookie).not.toMatch(/\bauth=.*/i);
  });
});
describe("GET /api/me", () => {
  it("should return the logged user", async () => {
    mockJwtVerify(mockedData.user[0].id.toString());

    const response = await api.get("/api/me").set("Cookie", ["auth=token"]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockedData.user[0]);
  });
  it("should fail without cookie", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("should not be called");
    });

    const response = await api.get("/api/me");

    expect(response.status).toBe(403);
  });
  it("should fail with invalid token", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("invalid token");
    });

    const response = await api.get("/api/me").set("Cookie", ["auth=token"]);

    expect(response.status).toBe(403);
  });
});
