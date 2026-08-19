import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

/**
 * Scans `src/database/` for all SQL files in the correct execution order:
 * 1. `schema.sql` (always first)
 * 2. migration files in `migrations/` (alphabetical order)
 * 3. `seeder.sql` (always last)
 *
 * Missing files or directories are silently skipped.
 */
export function scanDatabaseFiles(rootDir: string): string[] {
  const databaseDir = path.join(rootDir, "src/database");

  const files: string[] = [];

  // 1. schema.sql first
  const schemaFile = path.join(databaseDir, "schema.sql");
  if (fs.existsSync(schemaFile)) {
    files.push(schemaFile);
  }

  // 2. migration files in alphabetical order
  const migrationsDir = path.join(databaseDir, "migrations");
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => path.join(migrationsDir, f));

    files.push(...migrationFiles);
  }

  // 3. seeder.sql last
  const seederFile = path.join(databaseDir, "seeder.sql");
  if (fs.existsSync(seederFile)) {
    files.push(seederFile);
  }

  return files;
}

/**
 * Same as scanDatabaseFiles but excludes seeder.sql.
 * Used by `database:migrate` (production) and test infrastructure.
 */
export function scanMigrationFiles(rootDir: string): string[] {
  return scanDatabaseFiles(rootDir).filter(
    (f) => path.basename(f) !== "seeder.sql",
  );
}

/**
 * Computes the SHA-256 checksum of a file's content.
 */
export function computeChecksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Drops all user-created tables from the database.
 * Temporarily disables foreign keys to avoid cascade errors during drop.
 */
export function dropAllTables(database: DatabaseSync): void {
  const existingTables = database
    .prepare(
      "select name from sqlite_schema where type ='table' and name not like 'sqlite_%'",
    )
    .all();

  // Prevent errors because of cascade deletion
  database.exec("PRAGMA foreign_keys = OFF");

  for (const table of existingTables) {
    database.exec(`drop table "${table.name}"`);
  }

  // Re-enable cascade deletion
  database.exec("PRAGMA foreign_keys = ON");
}

/**
 * Ensures the _migrations tracking table exists.
 */
export function ensureMigrationsTable(database: DatabaseSync): void {
  database.exec(`
    create table if not exists _migrations (
      filename text primary key,
      checksum text not null,
      applied_at datetime default (strftime('%Y-%m-%dT%H:%M:%SZ'))
    );
  `);
}

/**
 * Records an executed SQL file in the _migrations table.
 */
export function recordMigration(
  database: DatabaseSync,
  filename: string,
  checksum: string,
): void {
  database
    .prepare("insert into _migrations (filename, checksum) values (?, ?)")
    .run(filename, checksum);
}
