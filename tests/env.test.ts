import { envSchema } from "../src/env";

describe("envSchema", () => {
  it("should validate valid environment variables", () => {
    const validEnv = {
      APP_PORT: "5173",
      APP_BASE_URL: "http://localhost:5173",
      APP_SECRET: "my-secret-key",
      VITE_TIMEZONE: "Europe/Paris",
    };

    const parsed = envSchema.parse(validEnv);
    expect(parsed.APP_PORT).toBe(5173);
    expect(parsed.APP_SECRET).toBe("my-secret-key");
    expect(parsed.VITE_TIMEZONE).toBe("Europe/Paris");
  });

  it("should reject invalid IANA timezones", () => {
    const invalidEnv = {
      APP_PORT: "5173",
      APP_BASE_URL: "http://localhost:5173",
      APP_SECRET: "my-secret-key",
      VITE_TIMEZONE: "Invalid/Timezone_Name",
    };

    expect(() => envSchema.parse(invalidEnv)).toThrow();
  });

  it("should reject invalid APP_PORT", () => {
    const invalidEnv = {
      APP_PORT: "not-a-number",
      APP_SECRET: "my-secret-key",
    };

    expect(() => envSchema.parse(invalidEnv)).toThrow();
  });
});
