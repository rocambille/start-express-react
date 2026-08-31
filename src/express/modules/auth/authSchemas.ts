/*
  Purpose:
  Centralize Zod schemas for Authentication tokens (SSOT).
*/

import { z } from "zod";

/*
  Magic Link Token Entity Schema
*/
export const MagicLinkTokenSchema = z.object({
  user_id: z.number(),
  token_hash: z.string(),
  expires_at: z.coerce.date(),
  consumed_at: z.coerce.date().nullable(),
});

export type MagicLinkToken = z.infer<typeof MagicLinkTokenSchema>;
