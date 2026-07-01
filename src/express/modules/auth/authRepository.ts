/*
  Purpose:
  Centralize all persistence logic related to Authentication tokens.
*/

import { z } from "zod";
import database from "../../../database";

const magicLinkTokenSchema: z.ZodType<MagicLinkToken> = z.object({
  user_id: z.number(),
  token_hash: z.string(),
  expires_at: z.coerce.date(),
  consumed_at: z.coerce.date().nullable(),
});

class AuthRepository {
  insertOrReplaceToken(
    userId: RowId,
    tokenHash: string,
    expiresAt: Date,
  ): RowId {
    const query = database.prepare(
      "insert or replace into magic_link_token (user_id, token_hash, expires_at) values (?, ?, ?)",
    );
    const result = query.run(userId, tokenHash, expiresAt.toISOString());

    return result.lastInsertRowid;
  }

  findByHash(tokenHash: string): MagicLinkToken | null {
    const query = database.prepare(
      "select user_id, token_hash, expires_at, consumed_at from magic_link_token where token_hash = ?",
    );
    const row = query.get(tokenHash);

    return row ? magicLinkTokenSchema.parse(row) : null;
  }

  markAsConsumed(userId: RowId): boolean {
    const query = database.prepare(
      "update magic_link_token set consumed_at = datetime('now') where user_id = ?",
    );
    const result = query.run(userId);

    return result.changes > 0;
  }
}

export default new AuthRepository();
