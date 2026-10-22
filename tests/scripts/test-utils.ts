import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface DbTestFixture {
  rootDir: string;
  databaseDir: string;
  migrationsDir: string;
  cleanup: () => Promise<void>;
}

/*
  Schema and seeder of the sandbox. They are the scripts' own fixture,
  not the project's: the database scripts must keep working whatever
  modules a project has (e.g. after make:purge removed item or user).
*/
const FIXTURE_SCHEMA = `create table author (
  id integer primary key not null,
  name text not null
);

create table note (
  id integer primary key not null,
  title text not null,
  author_id integer not null,
  foreign key(author_id) references author(id) on delete cascade
);
`;

const FIXTURE_SEEDER = `insert into author(id, name)
values
  (1, 'Ada');

insert into note(id, title, author_id)
values
  (1, 'First', 1),
  (2, 'Second', 1);
`;

/**
 * Creates a unique isolated database sandbox workspace under os.tmpdir()
 * and populates it with a fixture schema.sql and seeder.sql.
 */
export async function createDbTestFixture(
  prefix: string,
): Promise<DbTestFixture> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
  const databaseDir = path.join(rootDir, "src/database");
  const migrationsDir = path.join(databaseDir, "migrations");

  await fs.promises.mkdir(databaseDir, { recursive: true });

  await fs.promises.writeFile(
    path.join(databaseDir, "schema.sql"),
    FIXTURE_SCHEMA,
  );
  await fs.promises.writeFile(
    path.join(databaseDir, "seeder.sql"),
    FIXTURE_SEEDER,
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
