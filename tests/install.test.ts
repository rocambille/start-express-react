import path from "node:path";
import fs from "fs-extra";

import databaseClient, { type Rows } from "../src/database/client";

describe("Installation", () => {
  describe(".env file", () => {
    test("should exist at project root", async () => {
      const envPath = path.resolve(__dirname, "../.env");

      expect(await fs.exists(envPath)).toBe(true);
    });
    test("should define required environment variables", () => {
      expect(process.env.APP_SECRET).toBeDefined();
      expect(process.env.MYSQL_ROOT_PASSWORD).toBeDefined();
      expect(process.env.MYSQL_DATABASE).toBeDefined();
    });
  });
  describe("Database connection", () => {
    test("should connect successfully", async () => {
      const connection = await databaseClient.getConnection();

      expect(connection).toBeDefined();

      await connection.release();
    });
  });
  describe("Database schema", () => {
    test("should contain a 'user' table as defined in schema.sql", async () => {
      const [rows] = await databaseClient.query<Rows>(
        "show tables like 'user'",
      );

      expect(rows.length).toBe(1);
    });
  });
});

afterAll(async () => {
  await databaseClient.end();
});
