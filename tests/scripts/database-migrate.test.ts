import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { main as migrateMain } from "../../scripts/database-migrate";
import { main as resetMain } from "../../scripts/database-reset";
import database from "../../src/database";
import { createDbTestFixture, type DbTestFixture } from "./test-utils";

let mockDb = new DatabaseSync(":memory:");

vi.mock("../../src/database", () => ({
  get default() {
    return mockDb;
  },
}));

describe("database-migrate.ts", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let dbTestFixture: DbTestFixture;

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Create a unique temporary directory sandbox for each test case
    const fixture = await createDbTestFixture("db-migrate-test-");
    dbTestFixture = fixture;

    // Reset database state by instantiating a fresh in-memory database and running clean reset
    mockDb = new DatabaseSync(":memory:");
    await resetMain(["node", "script", "-n"], dbTestFixture.rootDir);
    consoleSpy.mockClear();
    warnSpy.mockClear();
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
    await dbTestFixture.cleanup();
  });

  it("fails when given unexpected arguments", async () => {
    await expect(
      migrateMain(["node", "script", "--unknown-flag"]),
    ).rejects.toThrow(/usage/i);
  });

  it("fails when given extra arguments", async () => {
    await expect(
      migrateMain(["node", "script", "--no-interaction", "--extra"]),
    ).rejects.toThrow(/usage/i);
  });

  it("cancels when user answers no interactively", async () => {
    // Create a dummy migration
    const testFile = path.join(dbTestFixture.migrationsDir, "0000_dummy.sql");

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(testFile, "SELECT 'hello, world!';\n");

    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "n",
      close: vi.fn(),
    });

    await migrateMain(["node", "script"], dbTestFixture.rootDir);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/cancelled/));
  });

  it("proceeds when user answers yes interactively", async () => {
    // Create a dummy migration
    const testFile = path.join(dbTestFixture.migrationsDir, "0000_dummy.sql");

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE interactive_test (id INTEGER PRIMARY KEY);\n",
    );

    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "y",
      close: vi.fn(),
    });

    await migrateMain(["node", "script"], dbTestFixture.rootDir);

    // Verify it migrated successfully
    const tables = database
      .prepare(
        "select name from sqlite_schema where type = 'table' and name = 'interactive_test'",
      )
      .all();
    expect(tables.length).toBe(1);
  });

  it("reports nothing to migrate when database is up to date", async () => {
    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/nothing to migrate/i),
    );
  });

  it("applies a new migration file", async () => {
    // Create a migration that adds a test table
    const testFile = path.join(
      dbTestFixture.migrationsDir,
      "0001_add_test_table.sql",
    );

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE test_migrate (id INTEGER PRIMARY KEY);\n",
    );

    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    // Verify the table was created
    const tables = database
      .prepare(
        "select name from sqlite_schema where type = 'table' and name = 'test_migrate'",
      )
      .all();

    expect(tables.length).toBe(1);

    // Verify it was tracked in _migrations
    const migration = database
      .prepare("select * from _migrations where filename = ?")
      .get("0001_add_test_table.sql") as
      | { filename: string; checksum: string }
      | undefined;

    expect(migration).toBeDefined();
    expect(migration?.checksum.length).toBe(64);
  });

  it("skips already-applied files", async () => {
    // Create and apply a migration
    const testFile = path.join(
      dbTestFixture.migrationsDir,
      "0002_skip_test.sql",
    );

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE skip_test (id INTEGER PRIMARY KEY);\n",
    );

    // Apply it once
    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);
    consoleSpy.mockClear();

    // Apply again: should report nothing to migrate
    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/nothing to migrate/i),
    );
  });

  it("warns when an applied file has been modified", async () => {
    // Create and apply a migration
    const testFile = path.join(
      dbTestFixture.migrationsDir,
      "0003_checksum_test.sql",
    );

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE checksum_test (id INTEGER PRIMARY KEY);\n",
    );

    // Apply it
    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);
    warnSpy.mockClear();

    // Modify the file
    await fs.promises.writeFile(
      testFile,
      "CREATE TABLE checksum_test (id INTEGER PRIMARY KEY, name TEXT);\n",
    );

    // Migrate again: should warn about modification
    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/was modified since it was applied/),
    );
  });

  it("does not apply seeder.sql", async () => {
    // After reset, seeder data exists. Let's clear it and migrate.
    database.exec("DELETE FROM item");
    database.exec("DELETE FROM user");
    consoleSpy.mockClear();

    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    // Seeder should NOT have been re-applied
    const users = database.prepare("select * from user").all();
    expect(users.length).toBe(0);
  });

  it("respects file ordering: schema.sql first, then migrations alphabetically", async () => {
    const fileA = path.join(dbTestFixture.migrationsDir, "aaa_first.sql");
    const fileB = path.join(dbTestFixture.migrationsDir, "zzz_second.sql");

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(fileA, "-- first\n");
    await fs.promises.writeFile(fileB, "-- second\n");

    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    const migrations = database
      .prepare(
        "SELECT filename FROM _migrations WHERE filename IN ('aaa_first.sql', 'zzz_second.sql') ORDER BY applied_at",
      )
      .all();

    const filenames = migrations.map((m) => m.filename);
    expect(filenames).toEqual(["aaa_first.sql", "zzz_second.sql"]);
  });

  it("rolls back on execution failure", async () => {
    const goodFile = path.join(dbTestFixture.migrationsDir, "0004_good.sql");
    const badFile = path.join(dbTestFixture.migrationsDir, "0005_bad.sql");

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(
      goodFile,
      "CREATE TABLE good_table (id INTEGER PRIMARY KEY);\n",
    );
    await fs.promises.writeFile(badFile, "THIS IS NOT VALID SQL;\n");

    await expect(
      migrateMain(["node", "script", "-n"], dbTestFixture.rootDir),
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
  });

  it("skips schema.sql gracefully if it is missing", async () => {
    // Start with a fresh in-memory database (bypassing beforeEach's resetMain state)
    mockDb = new DatabaseSync(":memory:");

    // Delete schema.sql from this sandbox
    await fs.promises.unlink(
      path.join(dbTestFixture.databaseDir, "schema.sql"),
    );

    // Run migration
    await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

    // Verify schema.sql is not tracked in _migrations
    const migrations = database
      .prepare("select filename from _migrations")
      .all();
    const filenames = migrations.map((m) => m.filename);
    expect(filenames).not.toContain("schema.sql");
  });

  describe("File-based Database", () => {
    let tempDbPath: string;

    beforeEach(async () => {
      tempDbPath = path.join(dbTestFixture.rootDir, "test-database.sqlite");
      mockDb = new DatabaseSync(tempDbPath);
      // Clean reset
      await resetMain(["node", "script", "-n"], dbTestFixture.rootDir);
      consoleSpy.mockClear();
      warnSpy.mockClear();
    });

    afterEach(async () => {
      mockDb.close();
      mockDb = new DatabaseSync(":memory:");
      await fs.promises.rm(tempDbPath, { force: true });
      await fs.promises.rm(`${tempDbPath}.bak`, { force: true });
    });

    it("creates backup, migrates successfully and cleans up backup", async () => {
      // Create a dummy migration in our isolated temp migrations directory
      const testFile = path.join(
        dbTestFixture.migrationsDir,
        "0099_file_db_test.sql",
      );
      await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
      await fs.promises.writeFile(
        testFile,
        "CREATE TABLE file_db_test (id INTEGER PRIMARY KEY);\n",
      );

      await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

      // Verify it applied successfully
      const tables = mockDb
        .prepare(
          "select name from sqlite_schema where type = 'table' and name = 'file_db_test'",
        )
        .all();
      expect(tables.length).toBe(1);

      // Verify the backup file was cleaned up (does not exist anymore)
      expect(fs.existsSync(`${tempDbPath}.bak`)).toBe(false);
    });

    it("reports nothing to migrate and cleans up backup on up-to-date file database", async () => {
      // Run once to ensure everything is up to date (and since there are no new migrations, pending is 0)
      await migrateMain(["node", "script", "-n"], dbTestFixture.rootDir);

      // Verify backup was deleted
      expect(fs.existsSync(`${tempDbPath}.bak`)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/nothing to migrate/i),
      );
    });

    it("removes backup when interactive migration is cancelled", async () => {
      // Create a dummy migration in our isolated temp migrations directory
      const testFile = path.join(
        dbTestFixture.migrationsDir,
        "0099_cancel_test.sql",
      );
      await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
      await fs.promises.writeFile(
        testFile,
        "CREATE TABLE cancel_test (id INTEGER PRIMARY KEY);\n",
      );

      const readline = await import("node:readline/promises");
      readline.default.createInterface = vi.fn().mockReturnValue({
        question: () => "n",
        close: vi.fn(),
      });

      await migrateMain(["node", "script"], dbTestFixture.rootDir);

      // Verify backup was deleted
      expect(fs.existsSync(`${tempDbPath}.bak`)).toBe(false);
    });

    it("restores database from backup and removes backup on migration failure", async () => {
      // Create a bad migration
      const testFile = path.join(
        dbTestFixture.migrationsDir,
        "0099_fail_test.sql",
      );
      await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
      await fs.promises.writeFile(testFile, "INVALID SQL STATEMENT;\n");

      await expect(
        migrateMain(["node", "script", "-n"], dbTestFixture.rootDir),
      ).rejects.toThrow();

      // Verify backup was deleted
      expect(fs.existsSync(`${tempDbPath}.bak`)).toBe(false);
      // Verify database is still queryable (restored and unlocked)
      const tables = mockDb
        .prepare(
          "select name from sqlite_schema where type = 'table' and name not like 'sqlite_%'",
        )
        .all();
      expect(tables.length).toBeGreaterThan(0);
    });
  });
});
