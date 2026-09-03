import { createInterface } from "node:readline/promises";
import { DatabaseSync } from "node:sqlite";
import type { Readable } from "node:stream";

const EXIT_COMMAND = ".exit";

export async function main(
  argv: string[] = process.argv,
  input: Readable = process.stdin,
) {
  const databasePath = argv[2];

  if (!databasePath) {
    throw new Error("Usage: database-repl <database-path>");
  }

  const database = new DatabaseSync(databasePath);

  console.info();
  console.info(`\tUsing database ${databasePath}`);
  console.info(`\tType ${EXIT_COMMAND} to close the interface`);
  console.info();

  const rl = createInterface({
    input,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  return new Promise<void>((resolve) => {
    rl.on("line", (raw) => {
      const line = raw.trim();

      if (line === EXIT_COMMAND) {
        rl.close();
        return;
      }

      if (line !== "") {
        try {
          const statement = database.prepare(line);

          if (statement.columns().length > 0) {
            console.table(statement.all());
          } else {
            console.log(statement.run());
          }
        } catch (err) {
          console.error(err instanceof Error ? err.message : err);
        }
      }

      rl.prompt();
    });

    rl.on("close", () => {
      database.close();
      resolve();
    });
  });
}

/* v8 ignore next 6 */
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
