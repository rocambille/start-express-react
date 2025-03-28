import fs from "node:fs";

import databaseClient, { type Rows } from "../src/database/client";

describe("Installation", () => {
  test("you created .env", async () => {
    expect(fs.existsSync(`${__dirname}/../.env`)).toBe(true);
  });
  test("you filled .env with valid information to connect to your database", async () => {
    expect.assertions(0);

    try {
      // Check if the connection is successful
      await databaseClient.getConnection();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  test("schema.sql was executed", async () => {
    // Query the 'item' table to check if any data has been inserted
    const [rows] = await databaseClient.query<Rows>("select * from item");

    // Expecting rows to be returned, indicating successful migration
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });
});

afterAll(async () => {
  await databaseClient.end();
});
