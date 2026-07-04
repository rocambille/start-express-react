import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import database from "../src/database";
import {
  computeChecksum,
  dropAllTables,
  ensureMigrationsTable,
  recordMigration,
  scanDatabaseFiles,
} from "./database-helpers";

export async function main(
  argv: string[] = process.argv,
  rootDirOverride?: string,
) {
  const rootDir = rootDirOverride ?? path.join(import.meta.dirname, "..");

  const databaseFile = database.location() ?? ":memory:";

  const args = argv.slice(2);

  const noInteraction =
    args.includes("--no-interaction") || args.includes("-n");

  const expectedArgs = noInteraction ? ["--no-interaction"] : [];

  if (args.length !== expectedArgs.length) {
    throw new Error("Usage: database-reset [--no-interaction|-n]");
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
        console.info("\nReset operation cancelled.");
        return;
      }
    } finally {
      rl.close();
    }
  }

  // Drop all existing tables (including _migrations)
  dropAllTables(database);

  // Create a fresh _migrations tracking table
  ensureMigrationsTable(database);

  // Scan and execute all SQL files in order
  const files = scanDatabaseFiles(rootDir);

  for (const file of files) {
    const sql = fs.readFileSync(file, "utf8");

    database.exec(sql);

    // Record the execution in _migrations
    const filename = path.basename(file);
    const checksum = computeChecksum(sql);
    recordMigration(database, filename, checksum);

    console.info(
      `\n'${path.normalize(file)}' loaded in '${path.normalize(databaseFile)}' ✅`,
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
