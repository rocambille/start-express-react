/*
  Purpose:
  Centralize all persistence logic related to User entities.

  This repository:
  - Is the single place that knows SQL details
  - Exposes a minimal, explicit CRUD interface
  - Enforces soft-deletion rules at the data-access level

  What this file intentionally does NOT do:
  - No authorization checks
  - No HTTP concerns
  - No business rules beyond persistence semantics

  Design notes:
  - Controllers and services rely on repository contracts
  - SQL queries are explicit (no ORM, no magic)
  - Soft delete is the default find behavior
*/

import z from "zod";

import database from "../../../database";

/* ************************************************************************ */
/* Schemas                                                                  */
/* ************************************************************************ */

const userSchema: z.ZodType<User> = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
});

/* ************************************************************************ */
/* Repository                                                               */
/* ************************************************************************ */

class UserRepository {
  /* ********************************************************************** */
  /* Create                                                                 */
  /* ********************************************************************** */

  /*
    Insert a new user.

    Contract:
    - Expects a complete User payload without `id`
    - Returns the newly generated primary key

    Notes:
    - No validation here (done earlier in the pipeline)
    - Assumes referential integrity (user_id exists)
  */
  create(user: Omit<User, "id">): RowId {
    const query = database.prepare(
      "insert into user (email, name) values (?, ?)",
    );
    const result = query.run(user.email, user.name);

    return result.lastInsertRowid;
  }

  /* ********************************************************************** */
  /* Read                                                                   */
  /* ********************************************************************** */

  /*
    Find a single user by id.

    Behavior:
    - Ignores soft-deleted rows (`deleted_at is null`)
    - Returns `null` when no matching user exists

    Why null instead of throwing:
    - Allows upper layers to decide HTTP semantics (404, 204, etc.)
  */
  find(byId: RowId): User | null {
    const query = database.prepare(
      "select id, email, name from user where id = ? and deleted_at is null",
    );
    const row = query.get(byId);

    return row ? userSchema.parse(row) : null;
  }

  /*
    Find a single user by email.

    Behavior:
    - Ignores soft-deleted rows (`deleted_at is null`)
    - Returns `null` when no matching user exists
    - Returns matching user when exists

    Why null instead of throwing:
    - Allows upper layers to decide HTTP semantics (404, 204, etc.)
  */
  findByEmail(byEmail: string): User | null {
    const query = database.prepare(
      "select id, email, name from user where email = ? and deleted_at is null",
    );
    const row = query.get(byEmail);

    return row ? userSchema.parse(row) : null;
  }

  /*
    Find or create a single user by email.

    Behavior:
    - Ignores soft-deleted rows (`deleted_at is null`)
    - Returns `null` when no matching user exists

    Why null instead of throwing:
    - Allows upper layers to decide HTTP semantics (404, 204, etc.)
  */
  findOrCreateByEmail(email: string): User {
    const user = this.findByEmail(email);
    if (user) return user;

    const name = email.split("@")[0];

    const id = this.create({
      email,
      name,
    });

    return { id, email, name };
  }

  /* ********************************************************************** */
  /* Update                                                                 */
  /* ********************************************************************** */

  /*
    Update an existing user.

    Contract:
    - Returns the number of affected rows
    - Does not check existence beforehand

    Why:
    - Allows callers to decide how to interpret "0 rows affected"
  */
  update(id: RowId, user: Omit<User, "id">): boolean {
    const query = database.prepare(
      "update user set email = ?, name = ? where id = ? and deleted_at is null",
    );
    const result = query.run(user.email, user.name, id);

    return result.changes > 0;
  }

  /* ********************************************************************** */
  /* Delete (soft & hard)                                                   */
  /* ********************************************************************** */

  /*
    Soft delete a user.

    Semantics:
    - Marks the row as deleted without removing it
    - Default find queries automatically ignore it
  */
  softDelete(id: RowId): boolean {
    const query = database.prepare(
      "update user set deleted_at = datetime('now') where id = ?",
    );
    const result = query.run(id);

    return result.changes > 0;
  }
}

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default new UserRepository();
