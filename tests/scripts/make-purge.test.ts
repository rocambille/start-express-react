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

  describe("purgeItems", () => {
    it("removes item table from schema.sql", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/database/schema.sql"),
        "utf8",
      );

      const itemTableRegex = /create table item[\s\S]*?;\n\n?/m;
      const result = content.replace(itemTableRegex, "");

      expect(result).not.toContain("create table item");
      expect(result).toContain("create table user");
      expect(result).toContain("create table magic_link_token");
    });

    it("removes item inserts from seeder.sql", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/database/seeder.sql"),
        "utf8",
      );

      const itemInsertRegex = /insert into item[\s\S]*?;\n/m;
      const result = content.replace(itemInsertRegex, "");

      expect(result).not.toContain("insert into item");
      expect(result).toContain("insert into user");
    });

    it("removes Item type from index.d.ts", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/types/index.d.ts"),
        "utf8",
      );

      const result = content.replace(
        `type Item = import("../express/modules/item/itemSchemas").Item;\n`,
        "",
      );

      expect(result).not.toContain("type Item");
      expect(result).toContain("type User");
    });

    it("removes item link from NavBar.tsx", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/react/components/NavBar.tsx"),
        "utf8",
      );

      const result = content.replace(
        `            {link("/items", "Items")}\n`,
        "",
      );

      expect(result).not.toContain("/items");
      expect(result).toContain("/account");
      expect(result).toContain("Home");
    });

    it("removes item routes from routes.tsx", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/react/routes.tsx"),
        "utf8",
      );

      const result = content
        .replace(`import { itemRoutes } from "./components/item/index";\n`, "")
        .replace(`          ...itemRoutes,\n`, "");

      expect(result).not.toContain("itemRoutes");
      expect(result).toContain("AccountPage");
    });

    it("removes item route from express routes.ts", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/express/routes.ts"),
        "utf8",
      );

      const result = content
        .replace(`import itemRoutes from "./modules/item/itemRoutes";\n`, "")
        .replace(`router.use(itemRoutes);\n`, "");

      expect(result).not.toContain("itemRoutes");
      expect(result).toContain("authRoutes");
      expect(result).toContain("userRoutes");
    });
  });

  describe("purgeAuth", () => {
    it("removes user and magic_link_token tables from schema.sql", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/database/schema.sql"),
        "utf8",
      );

      const userTableRegex = /create table user[\s\S]*?;\n\n?/m;
      const magicLinkTableRegex =
        /create table magic_link_token[\s\S]*?;\n\n?/m;
      const result = content
        .replace(userTableRegex, "")
        .replace(magicLinkTableRegex, "");

      expect(result).not.toContain("create table user");
      expect(result).not.toContain("create table magic_link_token");
      expect(result).toContain("create table item");
    });

    it("removes user inserts from seeder.sql", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/database/seeder.sql"),
        "utf8",
      );

      const userInsertRegex = /insert into user[\s\S]*?;\n\n?/m;
      const result = content.replace(userInsertRegex, "");

      expect(result).not.toContain("insert into user");
      expect(result).toContain("insert into item");
    });

    it("removes User and MagicLinkToken types from index.d.ts", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/types/index.d.ts"),
        "utf8",
      );

      const result = content.replace(
        `type User = import("../express/modules/user/userSchemas").User;\n`,
        "",
      );

      expect(result).not.toContain("type User");
      expect(result).toContain("type Item");
    });

    it("removes auth imports and loader from routes.tsx", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/react/routes.tsx"),
        "utf8",
      );

      const result = content
        .replace(
          `import AccountPage from "./components/auth/AccountPage";\n`,
          "",
        )
        .replace(`import VerifyPage from "./components/auth/VerifyPage";\n`, "")
        .replace(
          `import { AuthProvider } from "./components/auth/MeContext";\n`,
          "",
        )
        .replace(
          `import { type RouteObject, useLoaderData } from "react-router";`,
          `import type { RouteObject } from "react-router";`,
        )
        .replace(
          /Component: \(\) => \{[\s\S]*?\},\n/m,
          `Component: () => {\n      return (\n        <DataRefreshProvider>\n          <Layout />\n        </DataRefreshProvider>\n      );\n    },\n`,
        )
        .replace(/ {4}\/\*\n {6}Root loader:[\s\S]*?\n {4}\},\n/m, "")
        .replace(
          / {10}\{\n {12}path: "account",\n {12}element: <AccountPage \/>,\n {10}\},\n/m,
          "",
        )
        .replace(
          / {10}\{\n {12}path: "verify",\n {12}element: <VerifyPage \/>,\n {10}\},\n/m,
          "",
        );

      expect(result).not.toContain("AccountPage");
      expect(result).not.toContain("VerifyPage");
      expect(result).not.toContain("AuthProvider");
      expect(result).not.toContain("useLoaderData");
      expect(result).not.toContain("Root loader");
      expect(result).not.toContain('path: "account"');
      expect(result).not.toContain('path: "verify"');
      expect(result).toContain("DataRefreshProvider");
      expect(result).toContain("Layout");
    });

    it("removes auth code from Layout.tsx", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/react/components/Layout.tsx"),
        "utf8",
      );

      const result = content
        .replace(
          `import { Outlet, useLocation } from "react-router";`,
          `import { Outlet } from "react-router";`,
        )
        .replace(`import { useMe } from "./auth/MeContext";\n`, "")
        .replace(`import MagicLinkForm from "./auth/MagicLinkForm";\n`, "")
        .replace(`  const { isAuthenticated } = useMe();\n`, "")
        .replace(`  const location = useLocation();\n\n`, "")
        .replace(
          / {8}\{isAuthenticated \|\| location\.pathname === "\/verify" \? \(\n[\s\S]*?<Outlet \/>[\s\S]*?<\/Suspense>\n {8}\) : \(\n {10}<MagicLinkForm \/>\n {8}\)\}/m,
          `        <Suspense fallback={<p>Loading…</p>}>\n          <Outlet />\n        </Suspense>`,
        );

      expect(result).not.toContain("useMe");
      expect(result).not.toContain("MagicLinkForm");
      expect(result).not.toContain("useLocation");
      expect(result).not.toContain("isAuthenticated");
      expect(result).toContain("<Outlet />");
      expect(result).toContain("Suspense");
      expect(result).toContain("NavBar");
    });

    it("removes auth code from NavBar.tsx (after purgeItems)", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/react/components/NavBar.tsx"),
        "utf8",
      );

      // First simulate purgeItems removing the items link
      const afterItems = content.replace(
        `            {link("/items", "Items")}\n`,
        "",
      );

      // Then simulate purgeAuth
      const result = afterItems
        .replace(`import { useMe } from "./auth/MeContext";\n\n`, "")
        .replace(`  const { user, isAuthenticated } = useMe();\n`, "")
        .replace(/ {8}\{isAuthenticated && \(\n[\s\S]*?\n {8}\)}\n/m, "");

      expect(result).not.toContain("useMe");
      expect(result).not.toContain("isAuthenticated");
      expect(result).not.toContain("/items");
      expect(result).not.toContain("/account");
      expect(result).toContain("Home");
    });

    it("removes auth/user routes from express routes.ts", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/express/routes.ts"),
        "utf8",
      );

      const result = content
        .replace(`import authRoutes from "./modules/auth/authRoutes";\n`, "")
        .replace(`router.use(authRoutes);\n`, "")
        .replace(`import userRoutes from "./modules/user/userRoutes";\n`, "")
        .replace(`router.use(userRoutes);\n`, "");

      expect(result).not.toContain("authRoutes");
      expect(result).not.toContain("userRoutes");
      expect(result).toContain("itemRoutes");
    });
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
