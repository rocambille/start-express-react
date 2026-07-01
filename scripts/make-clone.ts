import path from "node:path";
import fs from "fs-extra";
import pluralize from "pluralize";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSafeReplacement(
  token: string,
  oldStr: string,
  newStr: string,
): string {
  const regex = new RegExp(escapeRegExp(oldStr), "ig");

  return token.replace(regex, (match: string) => {
    // Simple checks for casing
    const isAllUpperCase =
      match === match.toUpperCase() && match !== match.toLowerCase();
    const isFirstUpperCase =
      match[0] === match[0].toUpperCase() &&
      match[0] !== match[0].toLowerCase();

    if (isAllUpperCase) {
      return newStr.toUpperCase();
    } else if (isFirstUpperCase) {
      return newStr[0].toUpperCase() + newStr.slice(1);
    }
    return newStr.toLowerCase();
  });
}

/**
 * Replaces oldName with newName in a string, respecting CamelCase,
 * snake_case, and plural forms.
 */
function smartReplace(str: string, oldName: string, newName: string): string {
  const oldNamePlural = pluralize(oldName);
  const newNamePlural = pluralize(newName);

  // Split into tokens (words or separators or CamelCase transitions)
  const regex = /([a-zA-Z0-9]+)|([^a-zA-Z0-9]+)/g;
  let match = regex.exec(str);
  let result = "";

  while (match !== null) {
    const [_fullMatch, word, separator] = match;
    if (word) {
      // Within a word, we might still have CamelCase
      const subTokens = word.split(/(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/);
      result += subTokens
        .map((token) => {
          // Try plural first
          let replaced = getSafeReplacement(
            token,
            oldNamePlural,
            newNamePlural,
          );
          if (replaced === token) {
            // Then singular
            replaced = getSafeReplacement(token, oldName, newName);
          }
          return replaced;
        })
        .join("");
    } else {
      result += separator;
    }

    match = regex.exec(str);
  }
  return result;
}

/**
 * Recursively walks through a directory,
 * renames files and replaces content.
 */
async function walkAndReplace(
  dir: string,
  oldName: string,
  newName: string,
): Promise<void> {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    const newFileBase = smartReplace(file, oldName, newName);

    const newFilePath = path.join(dir, newFileBase);

    if (newFilePath !== fullPath) {
      await fs.move(fullPath, newFilePath, { overwrite: true });
    }

    if (stat.isDirectory()) {
      await walkAndReplace(newFilePath, oldName, newName);
    } else {
      // ✅ Replace inside file
      await replaceInsideFile(newFilePath, oldName, newName);
    }
  }
}

async function replaceInsideFile(
  filePath: string,
  oldName: string,
  newName: string,
): Promise<void> {
  const allowedExts = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".css",
    ".scss",
    ".html",
  ];
  if (!allowedExts.includes(path.extname(filePath))) {
    return;
  }

  const content = await fs.readFile(filePath, "utf8");

  const newContent = smartReplace(content, oldName, newName);

  if (content !== newContent) {
    await fs.writeFile(filePath, newContent, "utf8");
  }
}

export async function main(argv: string[] = process.argv) {
  const [, , src, dest, oldName, newName, ...unexpected] = argv;

  if (!src || !dest || !oldName || !newName || unexpected.length > 0) {
    throw new Error(
      "Usage: npm run make:clone -- <src> <dest> <OldName> <NewName>",
    );
  }

  // thx https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#identifiers
  const isValidJsIdentifier = (name: string) =>
    /^[$_\p{ID_Start}][$\p{ID_Continue}]*$/u.test(name);

  if (!isValidJsIdentifier(oldName)) {
    throw new Error(`❌ ${oldName} is not a valid identifier in JavaScript`);
  }
  if (!isValidJsIdentifier(newName)) {
    throw new Error(`❌ ${newName} is not a valid identifier in JavaScript`);
  }

  const srcPath = path.resolve(src);
  const destPath = path.resolve(dest);

  if (!(await fs.pathExists(srcPath))) {
    throw new Error(`❌ Source path does not exist: ${srcPath}`);
  }

  const stat = await fs.stat(srcPath);

  if (stat.isFile()) {
    // ✅ Handle single file cloning
    await fs.copy(srcPath, destPath);

    await replaceInsideFile(destPath, oldName, newName);

    console.info(`✅ Cloned file ${srcPath} → ${destPath}`);
  } else if (stat.isDirectory()) {
    // ✅ Handle folder cloning
    await fs.copy(srcPath, destPath);
    await walkAndReplace(destPath, oldName, newName);
    console.info(`✅ Cloned folder ${srcPath} → ${destPath}`);
  } else {
    throw new Error("❌ Source is neither a file nor a directory.");
  }

  // Provide contextual feedback via a pedagogical checklist
  const isExpress = destPath.includes(path.normalize("src/express/modules"));
  const isReact = destPath.includes(path.normalize("src/react/components"));

  const singular = newName[0].toUpperCase() + newName.slice(1);

  console.info(`
--- 📋 Post-cloning Checklist ---

[ ] Register the new table in src/database/schema.sql
[ ] (Optional) Add dummy data in src/database/seeder.sql
[ ] Sync database:

      npm run database:sync

[ ] Define the "${singular}" type in src/types/index.d.ts`);

  if (isExpress) {
    console.info(`[ ] Register the Express module in src/express/routes.ts:

      await importAndUse("./modules/${newName.toLowerCase()}/${newName.toLowerCase()}Routes");
`);
  }

  if (isReact) {
    console.info(`[ ] Register the React routes in src/react/routes.tsx:

      import { ${newName.toLowerCase()}Routes } from "./components/${newName.toLowerCase()}/index";

      ...

      children: [
        ...,
        ...${newName.toLowerCase()}Routes,
      ]
`);
  }

  console.info("---------------------------------\n");
}

/* v8 ignore next 6 */
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
