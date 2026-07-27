/*
  Purpose:
  Environment variables configuration.

  Responsibilities:
  - Define and validate environment variables
  - Provide default values for development
  - Ensure required variables are present

  Design notes:
  - All environment variables are loaded in a single pass
  - Zod schema validates all variables at once
  - Default values are provided for development

  Related docs:
  - https://zod.dev/
*/

import { z } from "zod";

/**
 * Helper: validates whether a string is a valid IANA timezone name.
 */
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Single-pass Zod schema validating both server (process.env)
 * and client (import.meta.env) environment variables.
 */
export const envSchema = z.object({
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(5173),
  APP_BASE_URL: z.url().default("http://localhost:5173"),
  APP_SECRET: z.string().min(1, "APP_SECRET is required"),
  SMTP_URL: z
    .url()
    .optional()
    .refine(
      (smtpUrl) => smtpUrl != null || process.env.NODE_ENV !== "production",
      {
        message: "SMTP_URL must be defined in production environment",
      },
    ),
  VITE_TIMEZONE: z
    .string()
    .refine(isValidTimezone, {
      message:
        "Invalid IANA timezone string (e.g. 'Europe/Paris', 'America/New_York')",
    })
    .default("Europe/Paris"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .optional()
    .default("development"),
});

// Single-pass parse merging process.env + import.meta.env
export const env = envSchema.parse({
  ...process.env,
  ...import.meta.env,
});
