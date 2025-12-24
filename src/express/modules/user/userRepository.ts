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
  - Soft delete is the default read behavior
*/

import databaseClient, {
  type Result,
  type Rows,
} from "../../../database/client";

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
  async create(user: Omit<UserWithPassword, "id">) {
    const [result] = await databaseClient.query<Result>(
      "insert into user (email, password) values (?, ?)",
      [user.email, user.password],
    );

    return result.insertId;
  }

  /* ********************************************************************** */
  /* Read                                                                   */
  /* ********************************************************************** */

  /*
    Read a single user by id.

    Behavior:
    - Ignores soft-deleted rows (`deleted_at is null`)
    - Returns `null` when no matching user exists

    Why null instead of throwing:
    - Allows upper layers to decide HTTP semantics (404, 204, etc.)
  */
  async read(byId: number): Promise<User | null> {
    const [rows] = await databaseClient.query<Rows>(
      "select id, email from user where id = ? and deleted_at is null",
      [byId],
    );

    if (rows[0] == null) {
      return null;
    }

    const { id, email } = rows[0];

    return { id, email };
  }

  /*
    Read all non-deleted users.

    Notes:
    - No pagination here by design
    - Meant to be composed or extended if needed
  */
  async readAll(): Promise<User[]> {
    const [rows] = await databaseClient.query<Rows>(
      "select id, email from user where deleted_at is null",
    );

    return rows.map<User>(({ id, email }) => ({ id, email }));
  }

  /*
    Read a single user by email.

    Behavior:
    - Ignores soft-deleted rows (`deleted_at is null`)
    - Returns `null` when no matching user exists
    - Returns a full user with password when matching user exists

    Why null instead of throwing:
    - Allows upper layers to decide HTTP semantics (404, 204, etc.)
  */
  async readByEmailWithPassword(
    byEmail: string,
  ): Promise<UserWithPassword | null> {
    const [rows] = await databaseClient.query<Rows>(
      "select id, email, password from user where email = ? and deleted_at is null",
      [byEmail],
    );

    if (rows[0] == null) {
      return null;
    }

    const { id, email, password } = rows[0];

    return { id, email, password };
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
  async update(id: number, user: Omit<UserWithPassword, "id">) {
    const [result] = await databaseClient.query<Result>(
      "update user set email = ?, password = ? where id = ? and deleted_at is null",
      [user.email, user.password, id],
    );

    return result.affectedRows;
  }

  /* ********************************************************************** */
  /* Delete (soft & hard)                                                   */
  /* ********************************************************************** */

  /*
    Soft delete a user.

    Semantics:
    - Marks the row as deleted without removing it
    - Default read queries automatically ignore it
  */
  async softDelete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "update user set deleted_at = now() where id = ?",
      [id],
    );

    return result.affectedRows;
  }

  /*
    Restore a soft-deleted user.
  */
  async softUndelete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "update user set deleted_at = null where id = ?",
      [id],
    );

    return result.affectedRows;
  }

  /*
    Hard delete a user.

    Warning:
    - This permanently removes the row
  */
  async hardDelete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from user where id = ?",
      [id],
    );

    return result.affectedRows;
  }
}

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default new UserRepository();
