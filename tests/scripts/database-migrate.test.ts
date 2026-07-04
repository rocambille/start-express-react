import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { main as migrateMain } from "../../scripts/database-migrate";
import { main as resetMain } from "../../scripts/database-reset";
import database from "../../src/database";

vi.mock("../../src/database", () => ({
  default: new DatabaseSync(":memory:"),
}));

describe("database-migrate.ts", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let tempRootDir: string;
  let tempDatabaseDir: string;
  let migrationsDir: string;

  const rootDir = path.join(import.meta.dirname, "../..");

  beforeAll(async () => {
    // Create a unique temporary directory for this test file
    tempRootDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "db-migrate-test-"),
    );
    tempDatabaseDir = path.join(tempRootDir, "src/database");
    migrationsDir = path.join(tempDatabaseDir, "migrations");

    await fs.promises.mkdir(tempDatabaseDir, { recursive: true });
    // Copy real schema.sql and seeder.sql
    const realDatabaseDir = path.join(rootDir, "src/database");
    await fs.promises.copyFile(
      path.join(realDatabaseDir, "schema.sql"),
      path.join(tempDatabaseDir, "schema.sql"),
    );
    await fs.promises.copyFile(
      path.join(realDatabaseDir, "seeder.sql"),
      path.join(tempDatabaseDir, "seeder.sql"),
    );
  });

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Start from a clean reset so _migrations is populated
    await resetMain(["node", "script", "-n"], tempRootDir);
    consoleSpy.mockClear();
    warnSpy.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  afterAll(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempRootDir, { recursive: true, force: true });
  });

  it("fails when given unexpected arguments", async () => {
    await expect(
      migrateMain(["node", "script", "--unknown-flag"], tempRootDir),
    ).rejects.toThrow(/usage/i);
  });

  it("reports nothing to migrate when database is up to date", async () => {
    await migrateMain(["node", "script", "-n"], tempRootDir);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/nothing to migrate/i),
    );
  });

  it("applies a new migration file", async () => {
    // Create a migration that adds a test table
    const testFile = path.join(migrationsDir, "0001_add_test_table.sql");

    await fs.promises.mkdir(migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE test_migrate (id INTEGER PRIMARY KEY);\n",
    );

    try {
      await migrateMain(["node", "script", "-n"], tempRootDir);

      // Verify the table was created
      const tables = database
        .prepare(
          "select name from sqlite_schema where type = 'table' and name = 'test_migrate'",
        )
        .all() as { name: string }[];

      expect(tables.length).toBe(1);

      // Verify it was tracked in _migrations
      const migration = database
        .prepare("select * from _migrations where filename = ?")
        .get("0001_add_test_table.sql") as
        | { filename: string; checksum: string }
        | undefined;

      expect(migration).toBeDefined();
      expect(migration?.checksum.length).toBe(64);
    } finally {
      await fs.promises.unlink(testFile);
    }
  });

  it("skips already-applied files", async () => {
    // Create and apply a migration
    const testFile = path.join(migrationsDir, "0002_skip_test.sql");

    await fs.promises.mkdir(migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE skip_test (id INTEGER PRIMARY KEY);\n",
    );

    try {
      // Apply it once
      await migrateMain(["node", "script", "-n"], tempRootDir);
      consoleSpy.mockClear();

      // Apply again: should report nothing to migrate
      await migrateMain(["node", "script", "-n"], tempRootDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/nothing to migrate/i),
      );
    } finally {
      await fs.promises.unlink(testFile);
    }
  });

  it("warns when an applied file has been modified", async () => {
    // Create and apply a migration
    const testFile = path.join(migrationsDir, "0003_checksum_test.sql");

    await fs.promises.mkdir(migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE checksum_test (id INTEGER PRIMARY KEY);\n",
    );

    try {
      // Apply it
      await migrateMain(["node", "script", "-n"], tempRootDir);
      warnSpy.mockClear();

      // Modify the file
      await fs.promises.writeFile(
        testFile,
        "CREATE TABLE checksum_test (id INTEGER PRIMARY KEY, name TEXT);\n",
      );

      // Migrate again: should warn about modification
      await migrateMain(["node", "script", "-n"], tempRootDir);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/was modified since it was applied/),
      );
    } finally {
      await fs.promises.unlink(testFile);
    }
  });

  it("does not apply seeder.sql", async () => {
    // After reset, seeder data exists. Let's clear it and migrate.
    database.exec("DELETE FROM item");
    database.exec("DELETE FROM user");
    consoleSpy.mockClear();

    await migrateMain(["node", "script", "-n"], tempRootDir);

    // Seeder should NOT have been re-applied
    const users = database.prepare("select * from user").all();
    expect(users.length).toBe(0);
  });

  it("respects file ordering: schema.sql first, then migrations alphabetically", async () => {
    const fileA = path.join(migrationsDir, "aaa_first.sql");
    const fileB = path.join(migrationsDir, "zzz_second.sql");

    await fs.promises.mkdir(migrationsDir, { recursive: true });
    await fs.promises.writeFile(fileA, "-- first\n");
    await fs.promises.writeFile(fileB, "-- second\n");

    try {
      await migrateMain(["node", "script", "-n"], tempRootDir);

      const migrations = database
        .prepare(
          "SELECT filename FROM _migrations WHERE filename IN ('aaa_first.sql', 'zzz_second.sql') ORDER BY applied_at",
        )
        .all() as { filename: string }[];

      const filenames = migrations.map((m) => m.filename);
      expect(filenames).toEqual(["aaa_first.sql", "zzz_second.sql"]);
    } finally {
      await fs.promises.unlink(fileA);
      await fs.promises.unlink(fileB);
    }
  });

  it("rolls back on execution failure", async () => {
    const goodFile = path.join(migrationsDir, "0004_good.sql");
    const badFile = path.join(migrationsDir, "0005_bad.sql");

    await fs.promises.mkdir(migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      goodFile,
      "CREATE TABLE good_table (id INTEGER PRIMARY KEY);\n",
    );
    await fs.promises.writeFile(badFile, "THIS IS NOT VALID SQL;\n");

    try {
      await expect(
        migrateMain(["node", "script", "-n"], tempRootDir),
      ).rejects.toThrow();

      // The good table should NOT exist (transaction was rolled back)
      const tables = database
        .prepare(
          "select name from sqlite_schema where type = 'table' and name = 'good_table'",
        )
        .all();

      expect(tables.length).toBe(0);

      // Neither file should be tracked in _migrations
      const tracked = database
        .prepare(
          "select * from _migrations where filename IN ('0004_good.sql', '0005_bad.sql')",
        )
        .all();

      expect(tracked.length).toBe(0);
    } finally {
      await fs.promises.unlink(goodFile);
      await fs.promises.unlink(badFile);
    }
  });
});
