import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import database from "../src/database";
import {
  computeChecksum,
  ensureMigrationsTable,
  recordMigration,
  scanMigrationFiles,
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
    throw new Error("Usage: database-migrate [--no-interaction|-n]");
  }

  // Back up the database file (temporary: deleted after migration)
  const backupFile = `${databaseFile}.bak`;
  const isFileDatabase = databaseFile !== ":memory:";

  if (isFileDatabase) {
    fs.copyFileSync(databaseFile, backupFile);
    console.info(`\nBackup created: '${path.normalize(backupFile)}'`);
  }

  // Ensure the _migrations tracking table exists
  ensureMigrationsTable(database);

  // Scan all SQL files (schema + migrations, excluding seeder)
  const files = scanMigrationFiles(rootDir);

  // Check which files have already been applied
  const applied = new Map<string, string>();
  const rows = database
    .prepare("select filename, checksum from _migrations")
    .all();

  for (const row of rows) {
    applied.set(String(row.filename), String(row.checksum));
  }

  // Determine which files need to be applied
  const pending: { file: string; sql: string }[] = [];

  for (const file of files) {
    const sql = fs.readFileSync(file, "utf8");
    const filename = path.basename(file);
    const currentChecksum = computeChecksum(sql);

    if (applied.has(filename)) {
      const storedChecksum = applied.get(filename);

      if (storedChecksum !== currentChecksum) {
        console.warn(
          `\n⚠️  '${filename}' was modified since it was applied. These changes will NOT take effect. Revert your change or write a new migration script.`,
        );
      }
    } else {
      pending.push({ file, sql });
    }
  }

  if (pending.length === 0) {
    console.info("\nNothing to migrate. Database is up to date. ✅");

    // Clean up backup
    if (isFileDatabase && fs.existsSync(backupFile)) {
      fs.unlinkSync(backupFile);
    }

    return;
  }

  // Confirm before applying
  console.info(`\n${pending.length} file(s) to apply:`);
  for (const { file } of pending) {
    console.info(`  - ${path.basename(file)}`);
  }

  if (!noInteraction) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await rl.question("\nApply these migrations? (y/N) ");

      if (answer.toLowerCase() !== "y") {
        console.info("\nMigration cancelled.");

        // Clean up backup
        if (isFileDatabase && fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile);
        }

        return;
      }
    } finally {
      rl.close();
    }
  }

  // Apply pending files inside a transaction
  try {
    database.exec("BEGIN");

    for (const { file, sql } of pending) {
      database.exec(sql);

      const filename = path.basename(file);
      const checksum = computeChecksum(sql);
      recordMigration(database, filename, checksum);

      console.info(
        `\n'${filename}' applied to '${path.normalize(databaseFile)}' ✅`,
      );
    }

    database.exec("COMMIT");

    console.info("\nMigration complete! ✅");
  } catch (error) {
    // Rollback the transaction
    try {
      database.exec("ROLLBACK");
    } catch {
      // ROLLBACK may fail if the transaction was already rolled back
    }

    // Restore from backup
    if (isFileDatabase && fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, databaseFile);
      console.info(
        `\nDatabase restored from backup: '${path.normalize(backupFile)}'`,
      );
    }

    throw error;
  } finally {
    // Always clean up the backup file
    if (isFileDatabase && fs.existsSync(backupFile)) {
      fs.unlinkSync(backupFile);
    }
  }
}

/* v8 ignore next 6 */
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
