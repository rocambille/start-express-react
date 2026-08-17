/*
  Purpose:
  Centralize all persistence logic related to Authentication tokens.
*/

import database from "../../../database";
import { type MagicLinkToken, MagicLinkTokenSchema } from "./authSchemas";

class AuthRepository {
  insertOrReplaceToken(userId: User["id"], tokenHash: string, expiresAt: Date) {
    const query = database.prepare(
      "insert or replace into magic_link_token (user_id, token_hash, expires_at) values (?, ?, ?)",
    );
    query.run(userId, tokenHash, expiresAt.toISOString());
  }

  findByHash(tokenHash: string): MagicLinkToken | null {
    const query = database.prepare(
      "select user_id, token_hash, expires_at, consumed_at from magic_link_token where token_hash = ?",
    );
    const row = query.get(tokenHash);

    return row ? MagicLinkTokenSchema.parse(row) : null;
  }

  markAsConsumed(userId: User["id"]): boolean {
    const query = database.prepare(
      "update magic_link_token set consumed_at = datetime('now') where user_id = ?",
    );
    const result = query.run(userId);

    return result.changes > 0;
  }
}

export default new AuthRepository();
