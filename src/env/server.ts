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

import { z } from "zod";

import { clientEnvSchema } from "./client";

/**
 * Server-side environment variables schema.
 * Validates all server and client environment variables.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(5173),
  APP_BASE_URL: z.url().default("http://localhost:5173"),
  APP_SECRET: z.string().min(1, "APP_SECRET is required"),
  SMTP_URL: z
    .url()
    .optional()
    .refine(
      (smtpUrl) => process.env.NODE_ENV !== "production" || smtpUrl != null,
      {
        message: "SMTP_URL must be defined in production environment",
      },
    ),
});

export const serverEnv = serverEnvSchema.parse(process.env ?? {});
