import { serverEnvSchema } from "../../src/env/server";

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

  it("should reject missing SMTP_URL in production", () => {
    const env = {
      APP_SECRET: "my-secret-key",
      NODE_ENV: "production",
      // SMTP_URL intentionally absent
    };

    expect(() => serverEnvSchema.parse(env)).toThrow(
      /SMTP_URL must be defined in production environment/,
    );
  });

  it("should accept a defined SMTP_URL in production", () => {
    const env = {
      APP_SECRET: "my-secret-key",
      NODE_ENV: "production",
      SMTP_URL: "smtp://mail.example.com",
    };

    const parsed = serverEnvSchema.parse(env);
    expect(parsed.SMTP_URL).toBe("smtp://mail.example.com");
  });

  it("should parse inline PEM DKIM private key and derive domain from SMTP_URL", () => {
    const env = {
      APP_SECRET: "my-secret-key",
      SMTP_URL: "smtp://smtp.example.com:587",
      DKIM_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----\nMIIE...",
    };

    const parsed = serverEnvSchema.parse(env);
    expect(parsed.DKIM_PRIVATE_KEY).toBe(
      "-----BEGIN RSA PRIVATE KEY-----\nMIIE...",
    );
    expect(parsed.DKIM_DOMAIN).toBe("example.com");
    expect(parsed.DKIM_SELECTOR).toBe("mail");
  });

  it("should respect explicit DKIM_DOMAIN and DKIM_SELECTOR", () => {
    const env = {
      APP_SECRET: "my-secret-key",
      SMTP_URL: "smtp://smtp.example.com:587",
      DKIM_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----\nMIIE...",
      DKIM_DOMAIN: "custom-domain.org",
      DKIM_SELECTOR: "sig1",
    };

    const parsed = serverEnvSchema.parse(env);
    expect(parsed.DKIM_DOMAIN).toBe("custom-domain.org");
    expect(parsed.DKIM_SELECTOR).toBe("sig1");
  });

  it("should reject non-existent DKIM_PRIVATE_KEY file path", () => {
    const env = {
      APP_SECRET: "my-secret-key",
      DKIM_PRIVATE_KEY: "/non/existent/path/dkim.key",
    };

    expect(() => serverEnvSchema.parse(env)).toThrow(
      /DKIM_PRIVATE_KEY file does not exist/,
    );
  });
});
