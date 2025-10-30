import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

import mysql from "mysql2/promise";

// Build the path to the schema SQL file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = path.join(__dirname, "../src/database/schema.sql");

// Setup readline for interactive confirmation.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Get variables from .env file for database connection
const { MYSQL_ROOT_PASSWORD, MYSQL_DATABASE } = process.env;

let databaseClient = null as mysql.Connection | null;

// Asks the user for confirmation.
async function confirm(question: string): Promise<boolean> {
  const answer = await rl.question(`${question} (y/N) `);
  return answer.toLowerCase() === "y";
}

async function main() {
  console.info(
    `This script will drop existing database '${MYSQL_DATABASE}' to create a new one.`,
  );

  const proceed = await confirm(
    "Are you sure you want to continue? This action cannot be undone.",
  );

  if (!proceed) {
    console.info("\nSync operation cancelled.");
    return;
  }

  // Read the SQL statements from the schema file
  const sql = await fs.readFile(schema, "utf8");

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

  console.info(
    `\nDatabase '${MYSQL_DATABASE}' in sync with '${path.normalize(schema)}' 🆙`,
  );
}

main()
  .catch((err) => {
    console.error("An unexpected error occurred:", err);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
    databaseClient?.end();
  });
