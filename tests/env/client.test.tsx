import { clientEnvSchema } from "../../src/env/client";

describe("clientEnvSchema", () => {
  it("should validate valid environment variables", () => {
    const validEnv = {
      VITE_TIMEZONE: "Europe/Paris",
    };

    const parsed = clientEnvSchema.parse(validEnv);
    expect(parsed.VITE_TIMEZONE).toBe("Europe/Paris");
  });

  it("should reject invalid IANA timezones", () => {
    const invalidEnv = {
      VITE_TIMEZONE: "Invalid/Timezone_Name",
    };

    expect(() => clientEnvSchema.parse(invalidEnv)).toThrow();
  });
});
