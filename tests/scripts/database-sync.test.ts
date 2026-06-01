import { DatabaseSync } from "node:sqlite";

import { main } from "../../scripts/database-sync";
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

describe("database-sync.ts", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("fails when no target is provided", async () => {
    await expect(main(["node", "script"])).rejects.toThrow(/usage/i);
  });

  it("fails when given unexpected arguments", async () => {
    await expect(main(["node", "script", "--unknown-flag"])).rejects.toThrow(
      /usage/i,
    );
  });

  it("cancels when user answers no interactively", async () => {
    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "n",
      close: vi.fn(),
    });

    await main(["node", "script", "both"]);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/cancelled/));
  });

  it("loads schema in interactive mode", async () => {
    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "y",
      close: vi.fn(),
    });

    await main(["node", "script", "schema"]);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBe(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBe(0);
  });

  it("loads schema in non-interactive mode", async () => {
    await main(["node", "script", "schema", "-n"]);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBe(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBe(0);
  });

  it("loads seeder in interactive mode", async () => {
    await main(["node", "script", "schema", "-n"]);

    checkSchema();

    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "y",
      close: vi.fn(),
    });

    await main(["node", "script", "seeder"]);

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });

  it("loads seeder in non-interactive mode", async () => {
    await main(["node", "script", "schema", "-n"]);

    checkSchema();

    await main(["node", "script", "seeder", "-n"]);

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });

  it("loads both in interactive mode", async () => {
    const readline = await import("node:readline/promises");
    readline.default.createInterface = vi.fn().mockReturnValue({
      question: () => "y",
      close: vi.fn(),
    });

    await main(["node", "script", "both"]);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });

  it("loads both in non-interactive mode", async () => {
    await main(["node", "script", "both", "-n"]);

    checkSchema();

    const users = database.prepare("select * from user").all();

    expect(users.length).toBeGreaterThan(0);

    const items = database.prepare("select * from item").all();

    expect(items.length).toBeGreaterThan(0);
  });
});
