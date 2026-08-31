import path from "node:path";
import readline from "node:readline/promises";

import fs from "fs-extra";

/* ************************************************************************ */
/* File system helpers                                                      */
/* ************************************************************************ */

// Removes a path (file or directory), silently ignoring missing files.
async function remove(rootDir: string, fileOrDirectoryPath: string) {
  try {
    await fs.remove(path.join(rootDir, fileOrDirectoryPath));
    console.info(`- Removed: ${fileOrDirectoryPath}`);
  } catch (err) {
    const { code } = err as { code: string };

    if (code !== "ENOENT") {
      console.error(`Error removing ${fileOrDirectoryPath}:`, err);
    }
  }
}

// Updates a file's content if it exists.
async function updateFile(
  rootDir: string,
  filePath: string,
  replacer: (content: string) => string,
) {
  try {
    const fullPath = path.join(rootDir, filePath);
    const content = await fs.readFile(fullPath, "utf-8");
    const newContent = replacer(content);
    if (content !== newContent) {
      await fs.writeFile(fullPath, newContent, "utf-8");
      console.info(`- Updated file: ${filePath}`);
    }
  } catch (err) {
    const { code } = err as { code: string };

    if (code !== "ENOENT") {
      console.error(`Error updating file ${filePath}:`, err);
    }
  }
}

/* ************************************************************************ */
/* Purge logic                                                              */
/* ************************************************************************ */

// Removes all files and code related to the 'item' module.
async function purgeItems(rootDir: string) {
  console.info("\nPurging 'item' module...");

  // Remove item module files and related React components.
  await remove(rootDir, "src/express/modules/item");
  await remove(rootDir, "src/react/components/item");
  await remove(rootDir, "tests/react/components/item");
  await remove(rootDir, "tests/fixtures/items.ts");
  await remove(rootDir, "tests/contracts/items.ts");

  // Remove item import and fixture seeding in test-utils.ts
  await updateFile(rootDir, "tests/express/test-utils.ts", (content) => {
    const itemInsertRegex = / {2}\/\* insert all items \*\/[\s\S]*?\}\n\n?/m;
    return content
      .replace(`import { allItems } from "../fixtures/items";\n`, "")
      .replace(itemInsertRegex, "");
  });

  // Remove item routes from Express.
  await updateFile(rootDir, "src/express/routes.ts", (content) =>
    content
      .replace(
        /import itemRoutes from "\.\/modules\/item\/itemRoutes";\n+/m,
        "",
      )
      .replace(`router.use(itemRoutes);\n`, ""),
  );

  // Remove item routes and import from React.
  await updateFile(rootDir, "src/react/routes.tsx", (content) =>
    content
      .replace(`import { itemRoutes } from "./components/item/index";\n`, "")
      .replace(`          ...itemRoutes,\n`, ""),
  );

  // Remove item table from schema.
  await updateFile(rootDir, "src/database/schema.sql", (content) => {
    const itemTableRegex = /create table item[\s\S]*?;\n\n?/m;
    return content.replace(itemTableRegex, "");
  });

  // Remove item inserts from seeder.
  await updateFile(rootDir, "src/database/seeder.sql", (content) => {
    const itemInsertRegex = /insert into item[\s\S]*?;\n/m;
    return content.replace(itemInsertRegex, "");
  });

  // Remove Item type.
  await updateFile(rootDir, "src/types/index.d.ts", (content) =>
    content.replace(
      `type Item = import("../express/modules/item/itemSchemas").Item;\n`,
      "",
    ),
  );

  // Remove item link from NavBar.
  await updateFile(rootDir, "src/react/components/NavBar.tsx", (content) =>
    content.replace(`            {link("/items", "Items")}\n`, ""),
  );
}

// Removes all files and code related to the 'auth' and 'user' modules.
async function purgeAuth(rootDir: string) {
  console.info("\nPurging 'auth' and 'user' modules...");

  // Remove auth and user module files and related React components.
  await remove(rootDir, "src/express/modules/auth");
  await remove(rootDir, "src/express/modules/user");
  await remove(rootDir, "src/react/components/auth");
  await remove(rootDir, "tests/react/components/auth");

  // Remove auth/user routes from Express.
  await updateFile(rootDir, "src/express/routes.ts", (content) =>
    content
      .replace(`import authRoutes from "./modules/auth/authRoutes";\n`, "")
      .replace(`router.use(authRoutes);\n`, "")
      .replace(`import userRoutes from "./modules/user/userRoutes";\n`, "")
      .replace(`router.use(userRoutes);\n`, ""),
  );

  // Remove user and magic_link_token tables from schema.
  await updateFile(rootDir, "src/database/schema.sql", (content) => {
    const userTableRegex = /create table user[\s\S]*?;\n\n?/m;
    const magicLinkTableRegex = /create table magic_link_token[\s\S]*?;\n\n?/m;
    return content.replace(userTableRegex, "").replace(magicLinkTableRegex, "");
  });

  // Remove user inserts from seeder.
  await updateFile(rootDir, "src/database/seeder.sql", (content) => {
    const userInsertRegex = /insert into user[\s\S]*?;\n\n?/m;
    return content.replace(userInsertRegex, "");
  });

  // Remove User type.
  await updateFile(rootDir, "src/types/index.d.ts", (content) =>
    content.replace(
      `type User = import("../express/modules/user/userSchemas").User;\n`,
      "",
    ),
  );

  // Remove auth imports, loader, and auth routes from routes.tsx.
  await updateFile(rootDir, "src/react/routes.tsx", (content) =>
    content
      // Remove auth-related imports
      .replace(`import AccountPage from "./components/auth/AccountPage";\n`, "")
      .replace(`import VerifyPage from "./components/auth/VerifyPage";\n`, "")
      .replace(
        `import { AuthProvider } from "./components/auth/MeContext";\n`,
        "",
      )
      // Simplify RouteObject import (remove useLoaderData)
      .replace(
        `import { type RouteObject, useLoaderData } from "react-router";`,
        `import type { RouteObject } from "react-router";`,
      )
      // Remove AuthProvider wrapper and useLoaderData usage
      .replace(
        /Component: \(\) => \{[\s\S]*?\},\n/m,
        `Component: () => {\n      return (\n        <DataRefreshProvider>\n          <Layout />\n        </DataRefreshProvider>\n      );\n    },\n`,
      )
      // Remove the loader
      .replace(/ {4}\/\*\n {6}Root loader:[\s\S]*?\n {4}\},\n/m, "")
      // Remove account and verify routes (inside pathless wrapper)
      .replace(
        / {10}\{\n {12}path: "account",\n {12}element: <AccountPage \/>,\n {10}\},\n/m,
        "",
      )
      .replace(
        / {10}\{\n {12}path: "verify",\n {12}element: <VerifyPage \/>,\n {10}\},\n/m,
        "",
      ),
  );

  // Remove auth-related code from Layout.tsx.
  await updateFile(rootDir, "src/react/components/Layout.tsx", (content) =>
    content
      // Remove auth imports
      .replace(
        `import { Outlet, useLocation } from "react-router";`,
        `import { Outlet } from "react-router";`,
      )
      .replace(`import { useMe } from "./auth/MeContext";\n`, "")
      .replace(`import MagicLinkForm from "./auth/MagicLinkForm";\n`, "")
      // Remove auth hooks
      .replace(`  const { isAuthenticated } = useMe();\n`, "")
      .replace(`  const location = useLocation();\n\n`, "")
      // Replace conditional rendering with simple Suspense + Outlet
      .replace(
        / {8}\{check\(\) \|\| location\.pathname === "\/verify" \? \(\n[\s\S]*?<Outlet \/>[\s\S]*?<\/Suspense>\n {8}\) : \(\n {10}<MagicLinkForm \/>\n {8}\)\}/m,
        `        <Suspense fallback={<p>Loading…</p>}>\n          <Outlet />\n        </Suspense>`,
      ),
  );

  // Remove auth-related code from NavBar.tsx.
  await updateFile(rootDir, "src/react/components/NavBar.tsx", (content) =>
    content
      .replace(`import { useMe } from "./auth/MeContext";\n\n`, "")
      .replace(`  const { isAuthenticated } = useMe();\n`, "")
      // After purgeItems, only the account link remains in the auth block.
      // Remove the whole conditional block.
      .replace(/ {8}\{check\(\) && \(\n[\s\S]*?\n {8}\)}\n/m, ""),
  );
}

/* ************************************************************************ */
/* Entry point                                                              */
/* ************************************************************************ */

export async function main(
  argv: string[] = process.argv,
  rootDirOverride?: string,
) {
  const rootDir = rootDirOverride ?? path.join(import.meta.dirname, "..");

  const args = argv.slice(2);

  const keepAuth = args.includes("--keep-auth");
  const noInteraction =
    args.includes("--no-interaction") || args.includes("-n");

  const expectedArgs = [
    ...(keepAuth ? ["--keep-auth"] : []),
    ...(noInteraction ? ["--no-interaction"] : []),
  ];

  if (args.length !== expectedArgs.length) {
    throw new Error(
      "Usage: npm run make:purge [-- --keep-auth] [--no-interaction|-n]",
    );
  }

  console.info(
    "This script will remove boilerplate modules from your project.",
  );

  if (keepAuth) {
    console.info(
      "The --keep-auth flag is present. Authentication and user modules will be preserved.",
    );
  } else {
    console.info("All boilerplate modules (item, user, auth) will be removed.");
  }

  if (!noInteraction) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await rl.question(
        "Are you sure you want to continue? This action cannot be undone. (y/N) ",
      );

      if (answer.toLowerCase() !== "y") {
        console.info("\nPurge operation cancelled.");
        return;
      }
    } finally {
      rl.close();
    }
  }

  await purgeItems(rootDir);

  if (!keepAuth) {
    await purgeAuth(rootDir);
  }

  console.info("\nPurge complete! ✨");
  console.info(
    "Please review the changes and manually resolve any remaining issues.",
  );
}

/* v8 ignore next 6 */
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
