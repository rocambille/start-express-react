/*
  Purpose:
  Centralize all persistence logic related to Item entities.

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

class ItemRepository {
  /* ********************************************************************** */
  /* Create                                                                 */
  /* ********************************************************************** */

  /*
    Insert a new item.

    Contract:
    - Expects a complete Item payload without `id`
    - Returns the newly generated primary key

    Notes:
    - No validation here (done earlier in the pipeline)
    - Assumes referential integrity (user_id exists)
  */
  async create(item: Omit<Item, "id">) {
    const [result] = await databaseClient.query<Result>(
      "insert into item (title, user_id) values (?, ?)",
      [item.title, item.user_id],
    );

    return result.insertId;
  }

  /* ********************************************************************** */
  /* Read                                                                   */
  /* ********************************************************************** */

  /*
    Read a single item by id.

    Behavior:
    - Ignores soft-deleted rows (`deleted_at is null`)
    - Returns `null` when no matching item exists

    Why null instead of throwing:
    - Allows upper layers to decide HTTP semantics (404, 204, etc.)
  */
  async read(byId: number): Promise<Item | null> {
    const [rows] = await databaseClient.query<Rows>(
      "select id, title, user_id from item where id = ? and deleted_at is null",
      [byId],
    );

    if (rows[0] == null) {
      return null;
    }

    const { id, title, user_id } = rows[0];

    return { id, title, user_id };
  }

  /*
    Read all non-deleted items.

    Notes:
    - No pagination here by design
    - Meant to be composed or extended if needed
  */
  async readAll(): Promise<Item[]> {
    const [rows] = await databaseClient.query<Rows>(
      "select id, title, user_id from item where deleted_at is null",
    );

    return rows.map<Item>(({ id, title, user_id }) => ({
      id,
      title,
      user_id,
    }));
  }

  /* ********************************************************************** */
  /* Update                                                                 */
  /* ********************************************************************** */

  /*
    Update an existing item.

    Contract:
    - Returns the number of affected rows
    - Does not check existence beforehand

    Why:
    - Allows callers to decide how to interpret "0 rows affected"
  */
  async update(id: number, item: Omit<Item, "id">) {
    const [result] = await databaseClient.query<Result>(
      "update item set title = ?, user_id = ? where id = ? and deleted_at is null",
      [item.title, item.user_id, id],
    );

    return result.affectedRows;
  }

  /* ********************************************************************** */
  /* Delete (soft & hard)                                                   */
  /* ********************************************************************** */

  /*
    Soft delete an item.

    Semantics:
    - Marks the row as deleted without removing it
    - Default read queries automatically ignore it
  */
  async softDelete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "update item set deleted_at = now() where id = ?",
      [id],
    );

    return result.affectedRows;
  }

  /*
    Restore a soft-deleted item.
  */
  async softUndelete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "update item set deleted_at = null where id = ?",
      [id],
    );

    return result.affectedRows;
  }

  /*
    Hard delete an item.

    Warning:
    - This permanently removes the row
  */
  async hardDelete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from item where id = ?",
      [id],
    );

    return result.affectedRows;
  }
}

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default new ItemRepository();
