import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface DbTestFixture {
  rootDir: string;
  databaseDir: string;
  migrationsDir: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates a unique isolated database sandbox workspace under os.tmpdir()
 * and populates it with the project's schema.sql and seeder.sql.
 */
export async function createDbTestFixture(
  prefix: string,
): Promise<DbTestFixture> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
  const databaseDir = path.join(rootDir, "src/database");
  const migrationsDir = path.join(databaseDir, "migrations");

  await fs.promises.mkdir(databaseDir, { recursive: true });

  const projectRoot = path.join(import.meta.dirname, "../..");
  await fs.promises.copyFile(
    path.join(projectRoot, "src/database/schema.sql"),
    path.join(databaseDir, "schema.sql"),
  );
  await fs.promises.copyFile(
    path.join(projectRoot, "src/database/seeder.sql"),
    path.join(databaseDir, "seeder.sql"),
  );

  const cleanup = async () => {
    await fs.promises.rm(rootDir, { recursive: true, force: true });
  };

  return {
    rootDir,
    databaseDir,
    migrationsDir,
    cleanup,
  };
}
