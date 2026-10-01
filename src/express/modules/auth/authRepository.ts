/*
  Purpose:
  Centralize all persistence logic related to Authentication tokens.
*/

import database from "../../../database";
import { UserSchema } from "../user/userSchemas";

class AuthRepository {
  insertToken(userId: User["id"], tokenHash: string, expiresAt: Date) {
    const query = database.prepare(
      "insert into magic_link_token (user_id, token_hash, expires_at) values (?, ?, ?)",
    );
    query.run(userId, tokenHash, expiresAt.toISOString());
  }

  consume(tokenHash: string): User["id"] | null {
    const query = database.prepare(`
      update magic_link_token
      set consumed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      where token_hash = ?
        and consumed_at is null
        and expires_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      returning user_id
    `);
    const row = query.get(tokenHash);

    return row ? UserSchema.shape.id.parse(row.user_id) : null;
  }
}

export default new AuthRepository();
