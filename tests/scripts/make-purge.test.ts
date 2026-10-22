import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

import { main } from "../../scripts/make-purge";

class TestError extends Error {
  code?: string;
}

const projectRoot = path.join(import.meta.dirname, "../..");

/**
 * Creates a project structure by copying the real source files.
 * This ensures our regex replacements are tested against the actual codebase,
 * preventing regressions when the codebase changes.
 */
async function scaffoldProject(rootDir: string) {
  await fs.copy(path.join(projectRoot, "src"), path.join(rootDir, "src"));
  await fs.copy(path.join(projectRoot, "tests"), path.join(rootDir, "tests"));

  // A module-specific test for each example module (see AGENTS.md)
  for (const module of ["item", "auth", "user"]) {
    await fs.outputFile(
      path.join(rootDir, "tests/express/modules", module, "probe.test.ts"),
      "",
    );
  }
}

const isAlreadyPurged = !fs.existsSync(
  path.join(projectRoot, "src/express/modules/item"),
);

describe.skipIf(isAlreadyPurged)("make-purge.ts", () => {
  let tmpDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "make-purge-test-"));
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    consoleSpy.mockRestore();
  });

  it("fails when given unexpected arguments", async () => {
    await expect(main(["node", "script", "--unknown-flag"])).rejects.toThrow(
      /usage/i,
    );
  });

  it("fails when given extra arguments", async () => {
    await expect(
      main(["node", "script", "--keep-auth", "--extra"]),
    ).rejects.toThrow(/usage/i);
  });

  describe("purge logic", () => {
    it("runs full purge (items, auth) in non-interactive mode", async () => {
      await scaffoldProject(tmpDir);

      await main(["node", "script", "-n"], tmpDir);

      // Verify item routes are gone
      const expressRoutes = await fs.readFile(
        path.join(tmpDir, "src/express/routes.ts"),
        "utf8",
      );
      expect(expressRoutes).not.toContain("itemRoutes");
      expect(expressRoutes).not.toContain("authRoutes");
      expect(expressRoutes).not.toContain("userRoutes");

      // Verify files were removed
      expect(
        await fs.pathExists(path.join(tmpDir, "src/express/modules/item")),
      ).toBe(false);
      expect(
        await fs.pathExists(path.join(tmpDir, "tests/fixtures/items.ts")),
      ).toBe(false);
      expect(
        await fs.pathExists(path.join(tmpDir, "src/express/modules/auth")),
      ).toBe(false);

      // Module-specific Express tests go with their module
      for (const module of ["item", "auth", "user"]) {
        expect(
          await fs.pathExists(
            path.join(tmpDir, "tests/express/modules", module),
          ),
        ).toBe(false);
      }

      // Run second time to ensure idempotency and cover unmodified files path
      await main(["node", "script", "-n"], tmpDir);
    });

    it("runs purge for items only with --keep-auth", async () => {
      await scaffoldProject(tmpDir);

      await main(["node", "script", "-n", "--keep-auth"], tmpDir);

      // Verify item routes are gone, but auth routes remain
      const expressRoutes = await fs.readFile(
        path.join(tmpDir, "src/express/routes.ts"),
        "utf8",
      );
      expect(expressRoutes).not.toContain("itemRoutes");
      expect(expressRoutes).toContain("authRoutes");

      // Verify files were removed/kept
      expect(
        await fs.pathExists(path.join(tmpDir, "src/express/modules/item")),
      ).toBe(false);
      expect(
        await fs.pathExists(path.join(tmpDir, "tests/fixtures/items.ts")),
      ).toBe(false);
      expect(
        await fs.pathExists(path.join(tmpDir, "src/express/modules/auth")),
      ).toBe(true);
    });

    it("cancels purge when user answers no interactively", async () => {
      await scaffoldProject(tmpDir);

      const readline = await import("node:readline/promises");
      readline.default.createInterface = vi.fn().mockReturnValue({
        question: () => "n",
        close: vi.fn(),
      });

      await main(["node", "script"], tmpDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/cancelled/),
      );
      expect(
        await fs.pathExists(path.join(tmpDir, "src/express/modules/item")),
      ).toBe(true);
    });

    it("proceeds with purge when user answers yes interactively", async () => {
      await scaffoldProject(tmpDir);

      const readline = await import("node:readline/promises");
      readline.default.createInterface = vi.fn().mockReturnValue({
        question: () => "y",
        close: vi.fn(),
      });

      await main(["node", "script", "--keep-auth"], tmpDir);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Purge complete/),
      );
      expect(
        await fs.pathExists(path.join(tmpDir, "src/express/modules/item")),
      ).toBe(false);
    });
  });

  /*
    The purge is checked on its result, not by replaying its replacements:
    a full copy of the project is purged, then it must type-check and its
    own test suite must pass. A pattern that no longer matches the code
    (a renamed hook, a new import) fails here.
  */
  describe("purged project", () => {
    const scaffoldFullProject = async (rootDir: string) => {
      // The whole project (tests may read any file), but not its local state
      const skipped = new Set(["node_modules", ".git", "data", "dist", ".env"]);

      for (const entry of await fs.readdir(projectRoot)) {
        if (!skipped.has(entry)) {
          await fs.copy(
            path.join(projectRoot, entry),
            path.join(rootDir, entry),
          );
        }
      }

      await fs.symlink(
        path.join(projectRoot, "node_modules"),
        path.join(rootDir, "node_modules"),
      );
    };

    const run = (rootDir: string, bin: string, args: string[]) =>
      execFileSync(path.join(projectRoot, "node_modules/.bin", bin), args, {
        cwd: rootDir,
        encoding: "utf8",
        stdio: "pipe",
        // A clean environment: the outer test run must not leak into it
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          APP_SECRET: "purge-test-secret",
        },
      });

    // Files of the purged project still referring to removed code
    const referencesTo = async (rootDir: string, pattern: RegExp) => {
      const files = await fs.readdir(rootDir, {
        recursive: true,
        withFileTypes: true,
      });

      const matches: string[] = [];

      for (const file of files) {
        const filePath = path.join(file.parentPath, file.name);

        if (
          !file.isFile() ||
          !/\.tsx?$/.test(file.name) ||
          filePath.includes("node_modules") ||
          filePath.includes(`${path.sep}scripts${path.sep}`) ||
          filePath.endsWith("make-purge.test.ts")
        ) {
          continue;
        }

        if (pattern.test(await fs.readFile(filePath, "utf8"))) {
          matches.push(path.relative(rootDir, filePath));
        }
      }

      return matches;
    };

    // Imports of removed modules (calls to removed endpoints are caught by
    // the purged project's own test run)
    const ITEM = /modules\/item\/|components\/item\/|fixtures\/items/;
    const AUTH =
      /modules\/(auth|user)\/|components\/auth\/|fixtures\/(auth|users)|MeContext|useMe\(/;

    it("keeps a working project after --keep-auth", async () => {
      await scaffoldFullProject(tmpDir);

      await main(["node", "script", "--keep-auth", "-n"], tmpDir);

      expect(await referencesTo(tmpDir, ITEM)).toEqual([]);
      expect(() =>
        run(tmpDir, "tsc", ["--noEmit", "-p", "tsconfig.test.json"]),
      ).not.toThrow();
      expect(() =>
        run(tmpDir, "vitest", ["run", "--exclude", "tests/install"]),
      ).not.toThrow();
    }, 120_000);

    it("keeps a working project after a full purge", async () => {
      await scaffoldFullProject(tmpDir);

      await main(["node", "script", "-n"], tmpDir);

      expect(await referencesTo(tmpDir, ITEM)).toEqual([]);
      expect(await referencesTo(tmpDir, AUTH)).toEqual([]);
      expect(() =>
        run(tmpDir, "tsc", ["--noEmit", "-p", "tsconfig.test.json"]),
      ).not.toThrow();
      expect(() =>
        run(tmpDir, "vitest", ["run", "--exclude", "tests/install"]),
      ).not.toThrow();
    }, 120_000);
  });

  describe("error handling in remove", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it("logs console error when fs.remove fails with non-ENOENT error", async () => {
      const mockError = new TestError("Permission denied");
      mockError.code = "EACCES";
      const removeSpy = vi.spyOn(fs, "remove").mockRejectedValueOnce(mockError);

      await main(["node", "script", "-n"], tmpDir);

      expect(errorSpy).toHaveBeenCalled();
      removeSpy.mockRestore();
    });

    it("silently ignores ENOENT error in remove", async () => {
      const mockError = new TestError("File not found");
      mockError.code = "ENOENT";
      const removeSpy = vi.spyOn(fs, "remove").mockRejectedValueOnce(mockError);

      await main(["node", "script", "-n"], tmpDir);

      expect(errorSpy).not.toHaveBeenCalled();
      removeSpy.mockRestore();
    });
  });

  describe("error handling in updateFile", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it("logs console error when fs.readFile fails with non-ENOENT error", async () => {
      await scaffoldProject(tmpDir);

      const mockError = new TestError("Permission denied");
      mockError.code = "EACCES";
      const readFileSpy = vi
        .spyOn(fs, "readFile")
        .mockRejectedValueOnce(mockError);

      await main(["node", "script", "-n"], tmpDir);

      expect(errorSpy).toHaveBeenCalled();
      readFileSpy.mockRestore();
    });
  });
});
