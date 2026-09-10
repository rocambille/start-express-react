/*
  Purpose:
  Centralize authentication tokens and database seeding for auth test cases.
*/
import crypto from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  consumedTokenUser,
  deletedUser,
  standardUser,
  userWithAvatar,
} from "./users";

export const authTokens = Object.freeze({
  success: "success_token",
  expired: "expired_token",
  consumed: "consumed_token",
  deletedUser: "deleted_token",
});

export const seedAuthTokens = (db: DatabaseSync) => {
  const insertMagicLinkToken = db.prepare(
    "insert into magic_link_token(user_id, token_hash, expires_at, consumed_at) values(?, ?, ?, ?)",
  );

  const hash = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");

  const validDate = new Date(Date.now() + 100000);
  const expiredDate = new Date(Date.now() - 100000);

  /* valid token for testing valid token scenarios */
  insertMagicLinkToken.run(
    standardUser.id,
    hash(authTokens.success),
    validDate.toISOString(),
    null,
  );

  /* expired token for testing expired token scenarios */
  insertMagicLinkToken.run(
    userWithAvatar.id,
    hash(authTokens.expired),
    expiredDate.toISOString(),
    null,
  );

  /* consumed token for testing consumed token scenarios */
  insertMagicLinkToken.run(
    consumedTokenUser.id,
    hash(authTokens.consumed),
    validDate.toISOString(),
    validDate.toISOString(),
  );

  /* deleted user for testing deleted user scenarios */
  insertMagicLinkToken.run(
    deletedUser.id,
    hash(authTokens.deletedUser),
    validDate.toISOString(),
    null,
  );
};
