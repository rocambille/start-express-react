import databaseClient, {
  type Result,
  type Rows,
} from "../../../database/client";

class ItemRepository {
  // The C of CRUD - Create operation

  async create(item: Omit<Item, "id">) {
    // Execute the SQL INSERT query to add a new item to the "item" table
    const [result] = await databaseClient.query<Result>(
      "insert into item (title, user_id) values (?, ?)",
      [item.title, item.user_id],
    );

    // Return the ID of the newly inserted item
    return result.insertId;
  }

  // The Rs of CRUD - Read operations

  async read(byId: number): Promise<Item | null> {
    // Execute the SQL SELECT query to retrieve a specific item by its ID
    const [rows] = await databaseClient.query<Rows>(
      "select id, title, user_id from item where id = ? and deleted_at is null",
      [byId],
    );

    // Return the first row of the result, which represents the item
    if (rows[0] == null) {
      return null;
    }

    const { id, title, user_id } = rows[0];

    return { id, title, user_id };
  }

  async readAll(): Promise<Item[]> {
    // Execute the SQL SELECT query to retrieve all items from the "item" table
    const [rows] = await databaseClient.query<Rows>(
      "select id, title, user_id from item where deleted_at is null",
    );

    // Return the array of items
    return rows.map<Item>(({ id, title, user_id }) => ({ id, title, user_id }));
  }

  // The U of CRUD - Update operation

  async update(id: number, item: Omit<Item, "id">) {
    // Execute the SQL UPDATE query to update an existing item in the "item" table
    const [result] = await databaseClient.query<Result>(
      "update item set title = ?, user_id = ? where id = ?",
      [item.title, item.user_id, id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }

  // The Ds of CRUD - Delete operations

  async softDelete(id: number) {
    // Execute the SQL UPDATE query to update an existing item in the "item" table
    const [result] = await databaseClient.query<Result>(
      "update item set deleted_at = now() where id = ?",
      [id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }

  async softUndelete(id: number) {
    // Execute the SQL UPDATE query to update an existing item in the "item" table
    const [result] = await databaseClient.query<Result>(
      "update item set deleted_at = null where id = ?",
      [id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }

  async hardDelete(id: number) {
    // Execute the SQL DELETE query to delete a specific item by its ID
    const [result] = await databaseClient.query<Result>(
      "delete from item where id = ?",
      [id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }
}

export default new ItemRepository();
