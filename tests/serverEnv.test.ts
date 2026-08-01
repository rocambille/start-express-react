import { serverEnvSchema } from "../src/env";

describe("serverEnvSchema", () => {
  it("should validate valid environment variables", () => {
    const validEnv = {
      APP_PORT: "5173",
      APP_BASE_URL: "http://localhost:5173",
      APP_SECRET: "my-secret-key",
    };

    const parsed = serverEnvSchema.parse(validEnv);
    expect(parsed.APP_PORT).toBe(5173);
    expect(parsed.APP_SECRET).toBe("my-secret-key");
  });

  it("should reject invalid APP_PORT", () => {
    const invalidEnv = {
      APP_PORT: "not-a-number",
      APP_SECRET: "my-secret-key",
    };

    expect(() => serverEnvSchema.parse(invalidEnv)).toThrow();
  });
});
