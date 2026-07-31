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

const processEnv = typeof process !== "undefined" ? process.env : {};
const metaEnv =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

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
 * Client-side environment variables schema.
 * Only validates variables accessible in browser / frontend context.
 */
export const clientEnvSchema = z.object({
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
      (smtpUrl) => {
        return smtpUrl != null || processEnv.NODE_ENV !== "production";
      },
      {
        message: "SMTP_URL must be defined in production environment",
      },
    ),
});

const isServer = typeof window === "undefined";

export const clientEnv = clientEnvSchema.parse(metaEnv);

export const serverEnv = isServer
  ? serverEnvSchema.parse(processEnv)
  : (null as unknown as z.infer<typeof serverEnvSchema>);
