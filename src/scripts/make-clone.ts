#!/usr/bin/env ts-node
import fs from "fs-extra";
import path from "path";

/**
 * Recursively walks through a directory,
 * renames files and replaces content.
 */
async function walkAndReplace(
  dir: string,
  oldName: string,
  newName: string
): Promise<void> {
  const files = await fs.readdir(dir);

  for (const file of files) {
    let fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await walkAndReplace(fullPath, oldName, newName);
    } else {
      // ✅ Rename file if filename contains oldName
      let newFilePath = fullPath.replace(oldName, newName);
      if (newFilePath !== fullPath) {
        await fs.move(fullPath, newFilePath, { overwrite: true });
        fullPath = newFilePath;
      }

      // ✅ Replace inside file
      let content = await fs.readFile(fullPath, "utf8");
      const regex = new RegExp(`\\b${oldName}\\b`, "g");
      content = content.replace(regex, newName);
      await fs.writeFile(fullPath, content, "utf8");
    }
  }
}

async function main() {
  const [, , src, dest, oldName, newName] = process.argv;

  if (!src || !dest || !oldName || !newName) {
    console.error(
      "Usage: npm run make:clone <src> <dest> <OldName> <NewName>"
    );
    process.exit(1);
  }

  const srcPath = path.resolve(src);
  const destPath = path.resolve(dest);

  if (!(await fs.pathExists(srcPath))) {
    console.error(`❌ Source path does not exist: ${srcPath}`);
    process.exit(1);
  }

  const stat = await fs.stat(srcPath);

  if (stat.isFile()) {
    // ✅ Handle single file cloning
    await fs.copy(srcPath, destPath);
    let content = await fs.readFile(destPath, "utf8");

    // Replace identifiers
    const regex = new RegExp(`\\b${oldName}\\b`, "g");
    content = content.replace(regex, newName);

    await fs.writeFile(destPath, content, "utf8");
    console.log(`✅ Cloned file ${srcPath} → ${destPath}`);
  } else if (stat.isDirectory()) {
    // ✅ Handle folder cloning
    await fs.copy(srcPath, destPath);
    await walkAndReplace(destPath, oldName, newName);
    console.log(`✅ Cloned folder ${srcPath} → ${destPath}`);
  } else {
    console.error("❌ Source is neither a file nor a directory.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
