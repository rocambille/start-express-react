import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

import { main } from "../../scripts/make-purge";

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
        await fs.pathExists(path.join(tmpDir, "src/express/modules/auth")),
      ).toBe(false);
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

      const result = content.replace(/type Item = \{[\s\S]*?\};\n\n?/m, "");

      expect(result).not.toContain("type Item");
      expect(result).toContain("type User");
      expect(result).toContain("type MagicLinkToken");
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
        .replace(`      ...itemRoutes,\n`, "");

      expect(result).not.toContain("itemRoutes");
      expect(result).toContain("AccountPage");
    });

    it("removes item route from express routes.ts", async () => {
      await scaffoldProject(tmpDir);

      const content = await fs.readFile(
        path.join(tmpDir, "src/express/routes.ts"),
        "utf8",
      );

      const result = content.replace(
        `await importAndUse("./modules/item/itemRoutes");\n`,
        "",
      );

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

      const result = content
        .replace(/type User = \{[\s\S]*?\};\n\n?/m, "")
        .replace(/type MagicLinkToken = \{[\s\S]*?\};\n\n?/m, "");

      expect(result).not.toContain("type User");
      expect(result).not.toContain("type MagicLinkToken");
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
          `import { AuthProvider } from "./components/auth/AuthContext";\n`,
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
          / {6}\{\n {8}path: "account",\n {8}element: <AccountPage \/>,\n {6}\},\n/m,
          "",
        )
        .replace(
          / {6}\{\n {8}path: "verify",\n {8}element: <VerifyPage \/>,\n {6}\},\n/m,
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
        .replace(`import { useAuth } from "./auth/AuthContext";\n`, "")
        .replace(`import MagicLinkForm from "./auth/MagicLinkForm";\n`, "")
        .replace(`  const { check } = useAuth();\n`, "")
        .replace(`  const location = useLocation();\n\n`, "")
        .replace(
          `        {check() || location.pathname === "/verify" ? (\n          <Outlet />\n        ) : (\n          <MagicLinkForm />\n        )}`,
          `        <Outlet />`,
        );

      expect(result).not.toContain("useAuth");
      expect(result).not.toContain("MagicLinkForm");
      expect(result).not.toContain("useLocation");
      expect(result).not.toContain("check()");
      expect(result).toContain("<Outlet />");
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
        .replace(`import { useAuth } from "./auth/AuthContext";\n\n`, "")
        .replace(`  const { check } = useAuth();\n`, "")
        .replace(/ {8}\{check\(\) && \(\n[\s\S]*?\n {8}\)}\n/m, "");

      expect(result).not.toContain("useAuth");
      expect(result).not.toContain("check()");
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
        .replace(`await importAndUse("./modules/auth/authRoutes");\n`, "")
        .replace(`await importAndUse("./modules/user/userRoutes");\n`, "");

      expect(result).not.toContain("authRoutes");
      expect(result).not.toContain("userRoutes");
      expect(result).toContain("itemRoutes");
    });
  });
});
