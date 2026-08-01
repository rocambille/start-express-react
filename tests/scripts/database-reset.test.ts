import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { main } from "../../scripts/database-reset";
import database from "../../src/database";
import { createDbTestFixture, type DbTestFixture } from "./test-utils";

let mockDb = new DatabaseSync(":memory:");

vi.mock("../../src/database", () => ({
  get default() {
    return mockDb;
  },
}));

const checkSchema = () => {
  const tables = database
    .prepare(
      "select name from sqlite_schema where type = 'table' and name not like 'sqlite_%'",
    )
    .all();

  const tableNames = tables.map((t) => t.name);

  expect(tableNames).toContain("user");
  expect(tableNames).toContain("item");
  expect(tableNames).toContain("magic_link_token");
};

describe("database-reset.ts", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let dbTestFixture: DbTestFixture;

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    // Create a unique temporary directory sandbox for each test case
    const fixture = await createDbTestFixture("db-reset-test-");
    dbTestFixture = fixture;

    // Reset database state by instantiating a fresh in-memory database
    mockDb = new DatabaseSync(":memory:");
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    await dbTestFixture.cleanup();
  });

  it("fails when given unexpected arguments", async () => {
    await expect(main(["node", "script", "--unknown-flag"])).rejects.toThrow(
      /usage/i,
    );
  });

  it("fails when given extra arguments", async () => {
    await expect(
      main(["node", "script", "--no-interaction", "--extra"]),
    ).rejects.toThrow(/usage/i);
  });

  it("cancels when user answers no interactively", async () => {
    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "n",
      close: vi.fn(),
    });

    await main(["node", "script"], dbTestFixture.rootDir);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/cancelled/));
  });

  it("loads schema, migrations and seeder in non-interactive mode", async () => {
    // Run once to create tables
    await main(["node", "script", "-n"], dbTestFixture.rootDir);

    checkSchema();

    // Run a second time: tables now exist and should be dropped successfully
    await main(["node", "script", "-n"], dbTestFixture.rootDir);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });

  it("loads schema, migrations and seeder in interactive mode", async () => {
    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "y",
      close: vi.fn(),
    });

    await main(["node", "script"], dbTestFixture.rootDir);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });

  it("populates _migrations table with all executed files", async () => {
    await main(["node", "script", "-n"], dbTestFixture.rootDir);

    const migrations = database
      .prepare("select filename, checksum from _migrations")
      .all();

    // Should have at least schema.sql and seeder.sql
    const filenames = migrations.map((m) => m.filename);
    expect(filenames).toContain("schema.sql");
    expect(filenames).toContain("seeder.sql");

    // All entries should have a checksum
    for (const m of migrations) {
      expect(m.checksum).toBeTruthy();
      expect(String(m.checksum).length).toBe(64); // SHA-256 hex
    }
  });

  it("includes migration files when present", async () => {
    // Create a temporary migration file in our sandbox
    const testMigration = path.join(
      dbTestFixture.migrationsDir,
      "0000_test_reset_migration.sql",
    );

    await fs.promises.mkdir(dbTestFixture.migrationsDir, { recursive: true });
    await fs.promises.writeFile(testMigration, "-- test migration for reset\n");

    await main(["node", "script", "-n"], dbTestFixture.rootDir);

    const migrations = database
      .prepare("select filename from _migrations")
      .all();

    const filenames = migrations.map((m) => m.filename);
    expect(filenames).toContain("0000_test_reset_migration.sql");
  });

  it("skips seeder.sql gracefully if it is missing", async () => {
    // Delete seeder.sql from this sandbox
    await fs.promises.unlink(
      path.join(dbTestFixture.databaseDir, "seeder.sql"),
    );

    await main(["node", "script", "-n"], dbTestFixture.rootDir);

    checkSchema();

    // Verify seeder.sql was not tracked in _migrations
    const migrations = database
      .prepare("select filename from _migrations")
      .all();
    const filenames = migrations.map((m) => m.filename);
    expect(filenames).toContain("schema.sql");
    expect(filenames).not.toContain("seeder.sql");
  });
});
