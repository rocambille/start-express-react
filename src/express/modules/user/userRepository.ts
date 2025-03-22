import databaseClient, {
  type Result,
  type Rows,
} from "../../../database/client";

class UserRepository {
  // The C of CRUD - Create operation

  async create(user: Omit<UserWithPassword, "id">) {
    // Execute the SQL INSERT query to add a new user to the "user" table
    const [result] = await databaseClient.query<Result>(
      "insert into user (email, password) values (?, ?)",
      [user.email, user.password],
    );

    // Return the ID of the newly inserted user
    return result.insertId;
  }

  // The Rs of CRUD - Read operations

  async read(id: number) {
    // Execute the SQL SELECT query to retrieve a specific user by its ID
    const [rows] = await databaseClient.query<Rows>(
      "select id, email from user where id = ? and deleted_at is null",
      [id],
    );

    // Return the first row of the result, which represents the user
    return rows[0] as User | null;
  }

  async readAll() {
    // Execute the SQL SELECT query to retrieve all users from the "user" table
    const [rows] = await databaseClient.query<Rows>(
      "select id, email from user where deleted_at is null",
    );

    // Return the array of users
    return rows as User[];
  }

  async readByEmailWithPassword(email: string) {
    // Execute the SQL SELECT query to retrieve a specific user by its email
    const [rows] = await databaseClient.query<Rows>(
      "select * from user where email = ?",
      [email],
    );

    // Return the first row of the result, which represents the user
    return rows[0] as UserWithPassword | null;
  }

  // The U of CRUD - Update operation

  async update(id: number, user: Omit<UserWithPassword, "id">) {
    // Execute the SQL UPDATE query to update an existing user in the "user" table
    const [result] = await databaseClient.query<Result>(
      "update user set email = ?, password = ? where id = ?",
      [user.email, user.password, id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }

  // The Ds of CRUD - Delete operations

  async softDelete(id: number) {
    // Execute the SQL UPDATE query to update an existing user in the "user" table
    const [result] = await databaseClient.query<Result>(
      "update user set deleted_at = now() where id = ?",
      [id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }

  async softUndelete(id: number) {
    // Execute the SQL UPDATE query to update an existing user in the "user" table
    const [result] = await databaseClient.query<Result>(
      "update user set deleted_at = null where id = ?",
      [id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }

  async hardDelete(id: number) {
    // Execute the SQL DELETE query to delete a specific user by its ID
    const [result] = await databaseClient.query<Result>(
      "delete from user where id = ?",
      [id],
    );

    // Return the number of affected rows
    return result.affectedRows;
  }
}

export default new UserRepository();
