import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

// Build the path to the schema SQL file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = path.join(__dirname, "../src/database/schema.sql");

// Get variables from .env file for database connection
const { MYSQL_ROOT_PASSWORD, MYSQL_DATABASE } = process.env;

let databaseClient = null;

try {
  // Read the SQL statements from the schema file
  const sql = fs.readFileSync(schema, "utf8");

  // Create a connection to the database
  databaseClient = await mysql.createConnection({
    uri: `mysql://root:${MYSQL_ROOT_PASSWORD}@database:3306/${MYSQL_DATABASE}`,
    multipleStatements: true, // Allow multiple SQL statements
  });

  // Drop the existing database if it exists
  await databaseClient.query(`drop database if exists ${MYSQL_DATABASE}`);

  // Create a new database with the specified name
  await databaseClient.query(`create database ${MYSQL_DATABASE}`);

  // Switch to the newly created database
  await databaseClient.query(`use ${MYSQL_DATABASE}`);

  // Execute the SQL statements to update the database schema
  await databaseClient.query(sql);

  console.info(`${MYSQL_DATABASE} updated from '${path.normalize(schema)}' 🆙`);
} catch (err) {
  const { message, stack } = err as Error;
  console.error("Error updating the database:", message, stack);
} finally {
  if (databaseClient != null) {
    // Close the database connection
    databaseClient.end();
  }
}
