import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";

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

// Removes a file if it exists.
async function removeFile(filePath: string) {
  try {
    await fs.rm(path.join(rootDir, filePath));
    console.log(`- Removed file: ${filePath}`);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.error(`Error removing file ${filePath}:`, error);
    }
  }
}

// Removes a directory recursively if it exists.
async function removeDir(dirPath: string) {
  try {
    await fs.rm(path.join(rootDir, dirPath), { recursive: true, force: true });
    console.log(`- Removed directory: ${dirPath}`);
  } catch (error) {
    console.error(`Error removing directory ${dirPath}:`, error);
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
      console.log(`- Updated file: ${filePath}`);
    }
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.error(`Error updating file ${filePath}:`, error);
    }
  }
}

// --- Purge Logic ---

// Removes all files and code related to the 'item' module.
async function purgeItems() {
  console.log("\nPurging 'item' module...");
  // Remove item module files and related React components/pages.
  await removeDir("src/express/modules/item");
  await removeFile("tests/api/items.test.ts");
  await removeFile("src/react/pages/ItemCreate.tsx");
  await removeFile("src/react/pages/ItemEdit.tsx");
  await removeFile("src/react/pages/ItemList.tsx");
  await removeFile("src/react/pages/ItemShow.tsx");
  await removeFile("src/react/components/ItemContext.tsx");
  await removeFile("src/react/components/ItemDeleteForm.tsx");
  await removeFile("src/react/components/ItemForm.tsx");

  // Remove item routes and imports from Express and React.
  await updateFile("src/express/routes.ts", (content) =>
    content
      .replace(`import itemRoutes from "./modules/item/itemRoutes";\n\n`, "")
      .replace(`router.use(itemRoutes);\n\n`, ""),
  );

  await updateFile("src/react/routes.tsx", (content) => {
    const lines = content.split("\n");
    const startIndex = lines.findIndex((line) =>
      line.trim().startsWith('path: "/items"'),
    );
    if (startIndex === -1) return content;

    let openBraces = 0;
    let endIndex = -1;

    // Find the block by counting braces.
    for (let i = startIndex - 1; i < lines.length; i += 1) {
      openBraces += (lines[i].match(/{/g) || []).length;
      openBraces -= (lines[i].match(/}/g) || []).length;
      if (openBraces === 0 && i >= startIndex) {
        endIndex = i;
        break;
      }
    }

    if (endIndex !== -1) {
      // Remove the block.
      lines.splice(startIndex - 1, endIndex - (startIndex - 1) + 1);
    }

    // Clean up imports.
    return lines
      .join("\n")
      .replace(/import ItemCreate from ".\/pages\/ItemCreate";\n/, "")
      .replace(/import ItemEdit from ".\/pages\/ItemEdit";\n/, "")
      .replace(/import ItemList from ".\/pages\/ItemList";\n/, "")
      .replace(/import ItemShow from ".\/pages\/ItemShow";\n/, "")
      .replace(
        /import { ItemProvider } from ".\/components\/ItemContext";\n/,
        "",
      );
  });

  // Remove item table and inserts from schema and types.
  await updateFile("src/database/schema.sql", (content) => {
    const itemTableRegex = /create table item[\s\S]*?;\n\n/m;
    const itemInsertRegex = /insert into item[\s\S]*?;\n/m;
    return content.replace(itemTableRegex, "").replace(itemInsertRegex, "");
  });

  await updateFile("src/types/index.d.ts", (content) =>
    content.replace(/type Item = {[\s\S]*?};\n\n/m, ""),
  );

  // Remove item-related tests.
  await updateFile("tests/react/pages.test.tsx", (content) =>
    content
      .replace(
        /import \* as ItemContext from ".\.\/.\.\/src\/react\/components\/ItemContext";\n\n/,
        "",
      )
      .replace(/import ItemCreate from ".\.\/.\.\/src\/react\/pages\/ItemCreate";\n/, "")
      .replace(/import ItemEdit from ".\.\/.\.\/src\/react\/pages\/ItemEdit";\n/, "")
      .replace(/import ItemList from ".\.\/.\.\/src\/react\/pages\/ItemList";\n/, "")
      .replace(/import ItemShow from ".\.\/.\.\/src\/react\/pages\/ItemShow";\n\n/, "")
      .replace(/const itemContextValue = {[\s\S]*?};\n\n/m, "")
      .replace(
        /vi\.spyOn\(ItemContext, "useItems"\)\.mockImplementation\(\(\) => itemContextValue\);\n/,
        "",
      )
      .replace(/test\("<ItemCreate \/>", async \(\) => {[\s\S]*?}\);\n\n/m, "")
      .replace(/test\("<ItemEdit \/>", async \(\) => {[\s\S]*?}\);\n\n/m, "")
      .replace(/test\("<ItemList \/>", async \(\) => {[\s\S]*?}\);\n\n/m, "")
      .replace(/test\("<ItemShow \/>", async \(\) => {[\s\S]*?}\);\n/m, ""),
  );

  await updateFile("tests/react/components.test.tsx", (content) =>
    content
      .replace(
        /import { ItemProvider, useItems } from ".\.\/.\.\/src\/react\/components\/ItemContext";\n/,
        "",
      )
      .replace(/test\("<ItemProvider \/>", async \(\) => {[\s\S]*?}\);\n\n/m, ""),
  );

  // Remove item link from NavBar.
  await updateFile("src/react/components/NavBar.tsx", (content) =>
    content.replace(`        {link("/items", "Items")}\n`, ""),
  );
}

// Remove all files and code related to the 'auth' and 'user' modules.
async function purgeAuth() {
  console.log("\nPurging 'auth' and 'user' modules...");
  // Remove auth and user module files and related React components.
  await removeDir("src/express/modules/user");
  await removeDir("src/express/modules/auth");
  await removeFile("tests/api/users.test.ts");
  await removeFile("src/react/components/AuthContext.tsx");
  await removeFile("src/react/components/AuthForm.tsx");
  await removeFile("src/react/components/LoginRegisterForm.tsx");
  await removeFile("src/react/components/LogoutForm.tsx");

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
      .replace(`import { AuthProvider } from "./AuthContext";\n`, "")
      .replace(`import AuthForm from "./AuthForm";\n`, "")
      .replace(`import BurgerMenu from "./BurgerMenu";\n`, "")
      .replace(/<AuthProvider>([\s\S]*)<\/AuthProvider>/m, "<>$1</>")
      .replace(/<BurgerMenu>[\s\S]*?<\/BurgerMenu>\s*/m, ""),
  );

  // Remove auth-related tests.
  await updateFile("tests/react/pages.test.tsx", (content) =>
    content
      .replace(
        /import \* as AuthContext from ".\.\/.\.\/src\/react\/components\/AuthContext";\n/,
        "",
      )
      .replace(/const authContextValue = {[\s\S]*?};\n\n/m, "")
      .replace(
        /vi\.spyOn\(AuthContext, "useAuth"\)\.mockImplementation\(\(\) => authContextValue\);\n\n/,
        "",
      ),
  );

  await updateFile("tests/react/components.test.tsx", (content) =>
    content
      .replace(
        /import \* as AuthContext from ".\.\/.\.\/src\/react\/components\/AuthContext";\n/,
        "",
      )
      .replace(
        /import { AuthProvider, useAuth } from ".\.\/.\.\/src\/react\/components\/AuthContext";\n/,
        "",
      )
      .replace(/const authContextValue = {[\s\S]*?};\n\n/m, "")
      .replace(/test\("<AuthProvider \/>", async \(\) => {[\s\S]*?}\);\n\n/m, "")
      .replace(
        /vi\.spyOn\(AuthContext, "useAuth"\)\.mockImplementation\(\(\) => authContextValue\);\n\n/,
        "",
      ),
  );
}

// Entry point: parse arguments, confirm, and run purge.
async function main() {
  const args = process.argv.slice(2);
  const keepAuth = args.includes("--keep-auth");

  console.log(
    "This script will remove boilerplate modules from your project.",
  );
  if (keepAuth) {
    console.log(
      "The --keep-auth flag is present. Authentication and user modules will be preserved.",
    );
  } else {
    console.log(
      "All boilerplate modules (item, user, auth) will be removed.",
    );
  }

  const proceed = await confirm(
    "Are you sure you want to continue? This action cannot be undone.",
  );

  if (!proceed) {
    console.log("Purge operation cancelled.");
    rl.close();
    return;
  }

  await purgeItems();

  if (!keepAuth) {
    await purgeAuth();
  }

  console.log("\nPurge complete! ✨");
  console.log(
    "Please review the changes and manually resolve any remaining issues.",
  );

  rl.close();
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  rl.close();
});