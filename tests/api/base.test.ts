import { api } from "./utils";

describe("GET /api", () => {
  it("should return successfully", async () => {
    const response = await api.get("/api");

    expect(response.status).toBe(200);
    expect(response.text).toBe("hello, world!");
  });
});
