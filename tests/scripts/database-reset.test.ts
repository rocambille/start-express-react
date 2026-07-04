import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { main } from "../../scripts/database-reset";
import database from "../../src/database";

vi.mock("../../src/database", () => ({
  default: new DatabaseSync(":memory:"),
}));

const checkSchema = () => {
  const tables = database
    .prepare(
      "select name from sqlite_schema where type = 'table' and name not like 'sqlite_%'",
    )
    .all() as { name: string }[];

  const tableNames = tables.map((t) => t.name);

  expect(tableNames).toContain("user");
  expect(tableNames).toContain("item");
  expect(tableNames).toContain("magic_link_token");
};

describe("database-reset.ts", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let tempRootDir: string;
  let tempDatabaseDir: string;
  let migrationsDir: string;

  const rootDir = path.join(import.meta.dirname, "../..");

  beforeAll(async () => {
    // Create a unique temporary directory for this test file
    tempRootDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "db-reset-test-"),
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

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  afterAll(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempRootDir, { recursive: true, force: true });
  });

  it("fails when given unexpected arguments", async () => {
    await expect(
      main(["node", "script", "--unknown-flag"], tempRootDir),
    ).rejects.toThrow(/usage/i);
  });

  it("cancels when user answers no interactively", async () => {
    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "n",
      close: vi.fn(),
    });

    await main(["node", "script"], tempRootDir);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/cancelled/));
  });

  it("loads schema, migrations and seeder in non-interactive mode", async () => {
    await main(["node", "script", "-n"], tempRootDir);

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

    await main(["node", "script"], tempRootDir);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });

  it("populates _migrations table with all executed files", async () => {
    await main(["node", "script", "-n"], tempRootDir);

    const migrations = database
      .prepare("select filename, checksum from _migrations")
      .all() as { filename: string; checksum: string }[];

    // Should have at least schema.sql and seeder.sql
    const filenames = migrations.map((m) => m.filename);
    expect(filenames).toContain("schema.sql");
    expect(filenames).toContain("seeder.sql");

    // All entries should have a checksum
    for (const m of migrations) {
      expect(m.checksum).toBeTruthy();
      expect(m.checksum.length).toBe(64); // SHA-256 hex
    }
  });

  it("includes migration files when present", async () => {
    // Create a temporary migration file
    const testMigration = path.join(
      migrationsDir,
      "0000_test_reset_migration.sql",
    );

    await fs.promises.mkdir(migrationsDir, { recursive: true });
    await fs.promises.writeFile(testMigration, "-- test migration for reset\n");

    try {
      await main(["node", "script", "-n"], tempRootDir);

      const migrations = database
        .prepare("select filename from _migrations")
        .all() as { filename: string }[];

      const filenames = migrations.map((m) => m.filename);
      expect(filenames).toContain("0000_test_reset_migration.sql");
    } finally {
      // Clean up
      await fs.promises.unlink(testMigration);
    }
  });
});
