import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

import fs from "fs-extra";

// Locate the project root directory (one level up from /bin).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");

// Setup readline for interactive confirmation.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Asks the user for confirmation.
async function confirm(question: string): Promise<boolean> {
  const answer = await rl.question(`${question} (y/N) `);
  return answer.toLowerCase() === "y";
}

// Removes a path (file or directory).
async function remove(fileOrDirectoryPath: string) {
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

// --- Purge Logic ---

// Removes all files and code related to the 'item' module.
async function purgeItems() {
  console.info("\nPurging 'item' module...");
  // Remove item module files and related React components.
  await remove("src/express/modules/item");
  await remove("src/react/components/item");
  await remove("tests/api/items.test.ts");
  await remove("tests/react/item.test.tsx");

  // Remove item routes and imports from Express and React.
  await updateFile("src/express/routes.ts", (content) =>
    content
      .replace(`import itemRoutes from "./modules/item/itemRoutes";\n\n`, "")
      .replace(`router.use(itemRoutes);\n\n`, ""),
  );

  await updateFile("src/react/routes.tsx", (content) =>
    content
      .replace(`import { itemRoutes } from "./components/item";\n`, "")
      .replace(`      itemRoutes,\n`, ""),
  );

  // Remove item table and inserts from schema and types.
  await updateFile("src/database/schema.sql", (content) => {
    const itemTableRegex = /create table item[\s\S]*?;\n\n/m;
    const itemInsertRegex = /insert into item[\s\S]*?;\n/m;
    return content.replace(itemTableRegex, "").replace(itemInsertRegex, "");
  });

  await updateFile("src/types/index.d.ts", (content) =>
    content.replace(/type Item = {[\s\S]*?};\n\n/m, ""),
  );

  // Remove item link from NavBar.
  await updateFile("src/react/components/NavBar.tsx", (content) =>
    content.replace(`        {link("/items", "Items")}\n`, ""),
  );
}

// Remove all files and code related to the 'auth' and 'user' modules.
async function purgeAuth() {
  console.info("\nPurging 'auth' and 'user' modules...");
  // Remove auth and user module files and related React components.
  await remove("src/express/modules/user");
  await remove("src/express/modules/auth");
  await remove("src/react/components/auth");
  await remove("tests/api/users.test.ts");
  await remove("tests/react/auth.test.tsx");

  // Remove auth/user routes and imports from Express.
  await updateFile("src/express/routes.ts", (content) =>
    content
      .replace(`import authRoutes from "./modules/auth/authRoutes";\n\n`, "")
      .replace(`router.use(authRoutes);\n\n`, "")
      .replace(`import userRoutes from "./modules/user/userRoutes";\n\n`, "")
      .replace(`router.use(userRoutes);\n\n`, ""),
  );

  // Remove user table and inserts from schema and types.
  await updateFile("src/database/schema.sql", (content) => {
    const userTableRegex = /create table user[\s\S]*?;\n\n/m;
    const userInsertRegex = /insert into user[\s\S]*?;\n\n/m;
    return content.replace(userTableRegex, "").replace(userInsertRegex, "");
  });

  await updateFile("src/types/index.d.ts", (content) =>
    content
      .replace(/type Credentials = {[\s\S]*?};\n\n/m, "")
      .replace(/type User = {[\s\S]*?};\n\n/m, "")
      .replace(/type UserWithPassword = User & {[\s\S]*?};\n/m, ""),
  );

  // Remove AuthProvider and related imports from Layout.
  await updateFile("src/react/components/Layout.tsx", (content) =>
    content
      .replace(`import { AuthProvider } from "./auth/AuthContext";\n`, "")
      .replace(`import AuthForm from "./auth/AuthForm";\n`, "")
      .replace(`import BurgerMenu from "./BurgerMenu";\n`, "")
      .replace(/<AuthProvider>([\s\S]*)<\/AuthProvider>/m, "<>$1</>")
      .replace(/<BurgerMenu>[\s\S]*?<\/BurgerMenu>\s*/m, ""),
  );
}

// Entry point: parse arguments, confirm, and run purge.
async function main() {
  const [, , keepAuth, ...unexpected] = process.argv;

  if ((keepAuth && keepAuth !== "--keep-auth") || unexpected.length > 0) {
    console.error("Usage: npm run make:purge [--keep-auth]");
    process.exit(1);
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

  const proceed = await confirm(
    "Are you sure you want to continue? This action cannot be undone.",
  );

  if (!proceed) {
    console.info("\nPurge operation cancelled.");
    return;
  }

  await purgeItems();

  if (!keepAuth) {
    await purgeAuth();
  }

  console.info("\nPurge complete! ✨");
  console.info(
    "Please review the changes and manually resolve any remaining issues.",
  );
}

main()
  .catch((err) => {
    console.error("An unexpected error occurred:", err);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
  });
