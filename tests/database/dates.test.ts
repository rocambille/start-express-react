/*
  Purpose:
  Guard the date rule of AGENTS.md: every date is written in ISO 8601 UTC.
  datetime('now') writes "YYYY-MM-DD HH:MM:SS" (no "T", no UTC marker),
  which compares wrongly, as text, with the ISO dates of created_at.

  Strategy:
  - Scan the source code and SQL files: the rule then covers every module,
    including the ones generated later (and those removed by make:purge)
  - Scan the code examples of AGENTS.md and the skills too: agents copy
    them into new modules (the prose may name datetime('now') to forbid it)
*/

import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "../..");

const filesOf = (folder: string, extension: RegExp) =>
  fs
    .readdirSync(path.join(root, folder), {
      recursive: true,
      withFileTypes: true,
    })
    .filter((entry) => entry.isFile() && extension.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));

const NOW_AS_DATETIME = /datetime\(\s*'now'/i;

// Fenced code blocks of a Markdown file
const codeBlocks = (markdown: string) =>
  markdown.match(/^```[\s\S]*?^```/gm) ?? [];

describe("Dates", () => {
  it("are never written with datetime('now')", () => {
    const code = /\.(ts|tsx|sql)$/;
    const offenders = [...filesOf("src", code), ...filesOf("scripts", code)]
      .filter((file) => NOW_AS_DATETIME.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(root, file));

    expect(offenders).toEqual([]);
  });

  it("are never written with datetime('now') in documented examples", () => {
    const docs = [path.join(root, "AGENTS.md"), ...filesOf(".agents", /\.md$/)];
    const offenders = docs
      .filter((file) =>
        codeBlocks(fs.readFileSync(file, "utf8")).some((block) =>
          NOW_AS_DATETIME.test(block),
        ),
      )
      .map((file) => path.relative(root, file));

    expect(offenders).toEqual([]);
  });

  it("default to ISO 8601 UTC in the schema", () => {
    const schema = fs.readFileSync(
      path.join(root, "src/database/schema.sql"),
      "utf8",
    );

    // Every date column with a default value (not null) uses the ISO format
    const defaults = schema
      .split("\n")
      .filter((line) => /\bdatetime\s+default\s+(?!null\b)/i.test(line));

    for (const line of defaults) {
      expect(line).toContain("strftime('%Y-%m-%dT%H:%M:%SZ')");
    }
  });
});
