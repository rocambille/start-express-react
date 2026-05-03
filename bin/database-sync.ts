import path from "node:path";
import readline from "node:readline/promises";
import fs from "fs-extra";
import database from "../src/database";

export async function main(
  argv: string[] = process.argv,
  rootDirOverride?: string,
) {
  const rootDir = rootDirOverride ?? path.join(import.meta.dirname, "..");

  // Locate the schema, seeder and database files
  const schemaFile = path.join(rootDir, "src/database/schema.sql");
  const seederFile = path.join(rootDir, "src/database/seeder.sql");
  const databaseFile = database.location() ?? ":memory:";

  const args = argv.slice(2);

  const target = args.includes("schema")
    ? "schema"
    : args.includes("seeder")
      ? "seeder"
      : args.includes("both")
        ? "both"
        : null;

  const noInteraction =
    args.includes("--no-interaction") || args.includes("-n");

  const expectedArgs = [target, ...(noInteraction ? ["--no-interaction"] : [])];

  if (target == null || args.length !== expectedArgs.length) {
    throw new Error(
      "Usage: database-sync [--no-interaction|-n] schema|seeder|both",
    );
  }

  console.info(
    `This script will drop existing data in '${path.normalize(databaseFile)}'.`,
  );

  if (!noInteraction) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await rl.question(
        "Are you sure you want to continue? This action cannot be undone. (y/N) ",
      );

      if (answer.toLowerCase() !== "y") {
        console.info("\nSync operation cancelled.");
        return;
      }
    } finally {
      rl.close();
    }
  }

  if (target === "schema" || target === "both") {
    // Drop existing tables
    const existingTables = database
      .prepare(
        "select name from sqlite_schema where type ='table' and name not like 'sqlite_%'",
      )
      .all() as { name: string }[];

    // Prevent errors because of cascade deletion
    database.exec("PRAGMA foreign_keys = OFF");

    for (const table of existingTables) {
      database.exec(`drop table "${table.name}"`);
    }

    // Re-enable cascade deletion
    database.exec("PRAGMA foreign_keys = ON");

    // Read the SQL statements from the schema file
    const sql = await fs.readFile(schemaFile, "utf8");

    // Execute the SQL statements to update the database schema
    database.exec(sql);

    console.info(
      `\nSchema '${path.normalize(schemaFile)}' loaded in '${path.normalize(databaseFile)}' 🆙`,
    );
  }

  if (target === "seeder" || target === "both") {
    // truncate existing tables
    const existingTables = database
      .prepare(`
        select name 
        from sqlite_schema 
        where type ='table' and name not like 'sqlite_%'`)
      .all();

    for (const table of existingTables) {
      database.exec(`delete from "${table.name}"`);
    }

    // Read the SQL statements from the seeder file
    const sql = await fs.readFile(seederFile, "utf8");

    // Execute the SQL statements to seed the database
    database.exec(sql);

    console.info(
      `\nSeeder '${path.normalize(seederFile)}' loaded in '${path.normalize(databaseFile)}' 🌱`,
    );
  }
}

/* v8 ignore next 6 */
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
