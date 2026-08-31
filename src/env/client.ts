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

/**
 * Helper: validates whether a string is a valid IANA timezone name.
 */
function isValidTimezone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
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

export const clientEnv = clientEnvSchema.parse(import.meta.env ?? {});
