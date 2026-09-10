import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Readable } from "node:stream";

import { main } from "../../scripts/database-repl";

/**
 * Creates a Readable stream that feeds lines one at a time,
 * simulating interactive user input to the REPL.
 */
const createInput = (...lines: string[]) => {
  return Readable.from(lines.map((line) => `${line}\n`));
};

describe("database-repl.ts", () => {
  let dbPath: string;
  let tmpDir: string;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let tableSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "database-repl-test-"),
    );
    dbPath = path.join(tmpDir, "test.sqlite");

    // Pre-populate the database with a simple table and row
    const db = new DatabaseSync(dbPath);
    db.exec("CREATE TABLE thing (id INTEGER PRIMARY KEY, name TEXT NOT NULL)");
    db.exec("INSERT INTO thing (name) VALUES ('alpha')");
    db.exec("INSERT INTO thing (name) VALUES ('beta')");
    db.close();

    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    tableSpy = vi.spyOn(console, "table").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    infoSpy.mockRestore();
    tableSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it("fails when no database path is provided", async () => {
    const input = createInput(".exit");

    await expect(main(["node", "script"], input)).rejects.toThrow(/usage/i);
  });

  it("prints a welcome banner with the database path", async () => {
    const input = createInput(".exit");

    await main(["node", "script", dbPath], input);

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Using database ${dbPath}`),
    );
  });

  it("displays rows with console.table for SELECT queries", async () => {
    const input = createInput("SELECT * FROM thing", ".exit");

    await main(["node", "script", dbPath], input);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: "alpha" }),
        expect.objectContaining({ id: 2, name: "beta" }),
      ]),
    );
  });

  it("displays rows with console.table for PRAGMA queries", async () => {
    const input = createInput("PRAGMA table_info(thing)", ".exit");

    await main(["node", "script", dbPath], input);

    expect(tableSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "id" }),
        expect.objectContaining({ name: "name" }),
      ]),
    );
  });

  it("displays run result for write queries", async () => {
    const input = createInput(
      "INSERT INTO thing (name) VALUES ('gamma')",
      ".exit",
    );

    await main(["node", "script", dbPath], input);

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ changes: 1 }),
    );
  });

  it("reports SQL errors without crashing", async () => {
    const input = createInput("SELECT * FROM nonexistent", ".exit");

    await main(["node", "script", dbPath], input);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent"),
    );
  });

  it("skips empty lines", async () => {
    const input = createInput("", "  ", "SELECT * FROM thing", ".exit");

    await main(["node", "script", dbPath], input);

    // console.table should be called exactly once (for the SELECT)
    expect(tableSpy).toHaveBeenCalledTimes(1);
  });

  it("closes the database on exit", async () => {
    const input = createInput(
      "INSERT INTO thing (name) VALUES ('delta')",
      ".exit",
    );

    await main(["node", "script", dbPath], input);

    // Verify the write was committed by opening a fresh connection
    const db = new DatabaseSync(dbPath);
    const rows = db
      .prepare("SELECT name FROM thing WHERE name = 'delta'")
      .all();
    db.close();

    expect(rows).toHaveLength(1);
  });
});
