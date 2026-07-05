import os from "node:os";
import path from "node:path";
import fs from "fs-extra";

import { main } from "../../scripts/make-clone";

describe("make-clone.ts", () => {
  let tmpDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "make-clone-test-"));
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.remove(tmpDir); // cleanup
    consoleSpy.mockRestore();
  });

  it("fails when missing arguments", async () => {
    await expect(main(["node", "script"])).rejects.toThrow(/usage/i);
  });

  it("fails with invalid JavaScript identifiers for oldName", async () => {
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");

    await expect(
      main(["node", "script", src, dest, "123cherry", "berry"]),
    ).rejects.toThrow(/is not a valid identifier/);
  });

  it("fails with invalid JavaScript identifiers for newName", async () => {
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");

    await expect(
      main(["node", "script", src, dest, "cherry", "123berry"]),
    ).rejects.toThrow(/is not a valid identifier/);
  });

  it("fails when source path does not exist", async () => {
    const src = path.join(tmpDir, "does-not-exist");
    const dest = path.join(tmpDir, "dest");

    await expect(
      main(["node", "script", src, dest, "cherry", "berry"]),
    ).rejects.toThrow(/Source path does not exist/);
  });

  it("fails when source is neither a file nor a directory", async () => {
    const src = path.join(tmpDir, "special");
    const dest = path.join(tmpDir, "dest");

    await fs.mkdir(src);

    const originalStat = fs.stat;
    const statSpy = vi.spyOn(fs, "stat").mockImplementation((...args) => {
      if (args[0] === src) {
        return Promise.resolve({
          isFile: () => false,
          isDirectory: () => false,
        });
      }
      return originalStat(...args);
    });

    await expect(
      main(["node", "script", src, dest, "cherry", "berry"]),
    ).rejects.toThrow(/Source is neither a file nor a directory/);

    statSpy.mockRestore();
  });

  it("clones a single file and replaces singular content", async () => {
    const src = path.join(tmpDir, "src", "cherry.ts");
    const dest = path.join(tmpDir, "dest", "berry.ts");

    await fs.ensureDir(path.dirname(src));
    await fs.writeFile(src, "export const cherry = 'sweet';\n");

    await main(["node", "script", src, dest, "cherry", "berry"]);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Cloned file/),
    );
    expect(await fs.exists(dest)).toBe(true);

    const content = await fs.readFile(dest, "utf8");

    expect(content).toBe("export const berry = 'sweet';\n");
  });

  it("clones a directory and renames files, resolving pluralization and case sensitivity", async () => {
    const srcDir = path.join(tmpDir, "src");
    const destDir = path.join(tmpDir, "dest");

    // Setup source files
    await fs.ensureDir(path.join(srcDir, "cherries"));
    await fs.writeFile(
      path.join(srcDir, "cherries", "CherryController.ts"),
      "export class CherryController { cherries = 10; CHERRY_MAX = 20; }\n",
    );
    // Unsupported extension
    await fs.writeFile(
      path.join(srcDir, "cherries", "image_cherry.png"),
      "binary content with cherry",
    );
    // Unrelated file
    await fs.writeFile(
      path.join(srcDir, "cherries", "Unrelated.ts"),
      "export class Unrelated { apple = 10; }\n",
    );

    await main(["node", "script", srcDir, destDir, "cherry", "berry"]);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Cloned folder/),
    );
    expect(await fs.exists(path.join(destDir, "berries"))).toBe(true);

    // Check TS file
    const tsFile = path.join(destDir, "berries", "BerryController.ts");

    expect(await fs.exists(tsFile)).toBe(true);

    const tsContent = await fs.readFile(tsFile, "utf8");

    expect(tsContent).toContain("export class BerryController");
    expect(tsContent).toContain("berries = 10;");
    expect(tsContent).toContain("BERRY_MAX = 20;");

    // Check unsupported file
    const pngFile = path.join(destDir, "berries", "image_berry.png");

    expect(await fs.exists(pngFile)).toBe(true);

    const pngContent = await fs.readFile(pngFile, "utf8");

    expect(pngContent).toBe("binary content with cherry");

    // Check unrelated file
    const unrelatedFile = path.join(destDir, "berries", "Unrelated.ts");

    expect(await fs.exists(unrelatedFile)).toBe(true);

    const unrelatedContent = await fs.readFile(unrelatedFile, "utf8");

    expect(unrelatedContent).toBe("export class Unrelated { apple = 10; }\n");
  });

  it("clones to src/express/modules and logs checklist instructions", async () => {
    const src = path.join(tmpDir, "src", "cherry.ts");
    const dest = path.join(tmpDir, "src", "express", "modules", "berry.ts");

    await fs.ensureDir(path.dirname(src));
    await fs.writeFile(src, "export const cherry = 'sweet';\n");

    await main(["node", "script", src, dest, "cherry", "berry"]);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Register the Express module in src\/express\/routes.ts/,
      ),
    );
  });

  it("clones to src/react/components and logs checklist instructions", async () => {
    const src = path.join(tmpDir, "src", "cherry.ts");
    const dest = path.join(tmpDir, "src", "react", "components", "berry.ts");

    await fs.ensureDir(path.dirname(src));
    await fs.writeFile(src, "export const cherry = 'sweet';\n");

    await main(["node", "script", src, dest, "cherry", "berry"]);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /Register the React routes in src\/react\/routes.tsx/,
      ),
    );
  });
});
