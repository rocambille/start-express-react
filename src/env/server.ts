/*
  Purpose:
  Environment variables configuration.

  Responsibilities:
  - Define and validate environment variables
  - Provide default values for development
  - Ensure required variables are present

  Design notes:
  - Client and server environment schemas are separated
  - Browser environments only parse client-accessible variables
  - Server environments validate full configuration including secrets

  Related docs:
  - https://zod.dev/
*/

import fs from "node:fs";
import { z } from "zod";

import { clientEnvSchema } from "./client";

const resolveDkimDomain = (
  smtpUrl?: string,
  customDomain?: string,
): string | undefined => {
  if (customDomain) return customDomain;
  if (!smtpUrl) return;
  try {
    return new URL(smtpUrl).hostname.replace(/^(?:mail|smtp)\./i, "");
  } catch {
    return;
  }
};

const resolveDkimPrivateKey = (keyOrPath?: string): string | undefined => {
  if (!keyOrPath) return;
  if (keyOrPath.startsWith("-----BEGIN")) {
    return keyOrPath;
  }
  return fs.readFileSync(keyOrPath, "utf8");
};

/**
 * Server-side environment variables schema.
 * Validates all server and client environment variables.
 */
export const serverEnvSchema = clientEnvSchema
  .extend({
    APP_PORT: z.coerce.number().int().min(1).max(65535).default(5173),
    APP_BASE_URL: z.url().default("http://localhost:5173"),
    APP_SECRET: z.string().min(1, "APP_SECRET is required"),
    SMTP_URL: z.url().optional(),
    DKIM_PRIVATE_KEY: z.string().optional(),
    DKIM_DOMAIN: z.string().optional(),
    DKIM_SELECTOR: z.string().default("mail"),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && data.SMTP_URL == null) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_URL"],
        message: "SMTP_URL must be defined in production environment",
      });
    }

    if (
      data.DKIM_PRIVATE_KEY &&
      !data.DKIM_PRIVATE_KEY.startsWith("-----BEGIN") &&
      !fs.existsSync(data.DKIM_PRIVATE_KEY)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["DKIM_PRIVATE_KEY"],
        message: `DKIM_PRIVATE_KEY file does not exist: ${data.DKIM_PRIVATE_KEY}`,
      });
    }
  })
  .transform((data) => ({
    ...data,
    DKIM_DOMAIN: resolveDkimDomain(data.SMTP_URL, data.DKIM_DOMAIN),
    DKIM_PRIVATE_KEY: resolveDkimPrivateKey(data.DKIM_PRIVATE_KEY),
  }));

export const serverEnv = serverEnvSchema.parse(process.env);
