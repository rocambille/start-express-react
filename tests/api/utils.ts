import type { FieldPacket, QueryOptions } from "mysql2";
import databaseClient, {
  type Result,
  type Rows,
} from "../../src/database/client";

export const mockedData: { item: Item[]; user: User[] } = {
  item: [{ id: 1, title: "foo", user_id: 1 }],
  user: [{ id: 1, email: "foo@mail.com" }],
};

export const mockedInsertId = 42;

export const mockDatabaseClient = () => {
  databaseClient.query = vi
    .fn()
    .mockImplementation(
      async (sqlOrOptions: string | QueryOptions, values?: unknown) => {
        const sql =
          typeof sqlOrOptions === "string" ? sqlOrOptions : sqlOrOptions.sql;

        if (sql.match(/\binsert\b/i)) {
          return [{ insertId: 42 } as Result, [] as FieldPacket[]];
        }
        if (sql.match(/\bselect\b/i)) {
          const tableName = sql.match(/\bfrom\s([A-Za-z][\w]*)/i)?.at(1) as
            | null
            | keyof typeof mockedData;

          if (tableName != null) {
            const table = mockedData[tableName];

            if (sql.match(/\bwhere\s*id\s*=/i)) {
              return [
                table.filter(
                  ({ id }) => id === (values as number[]).at(0),
                ) as Rows,
                [] as FieldPacket[],
              ];
            }

            return [table as Rows, [] as FieldPacket[]];
          }
        }
        if (sql.match(/\bupdate\b/i)) {
          const tableName = sql.match(/\bupdate\s([A-Za-z][\w]*)/i)?.at(1) as
            | null
            | keyof typeof mockedData;

          if (tableName != null) {
            const table = mockedData[tableName];

            if (sql.match(/\bwhere\s*id\s*=/i)) {
              return [
                table.find(({ id }) => id === (values as number[]).at(-1)) !=
                null
                  ? { affectedRows: 1 }
                  : { affectedRows: 0 },
                [] as FieldPacket[],
              ];
            }
          }
        }
        if (sql.match(/\bdelete\b/i)) {
          const tableName = sql.match(/\bfrom\s([A-Za-z][\w]*)/i)?.at(1) as
            | null
            | keyof typeof mockedData;

          if (tableName != null) {
            const table = mockedData[tableName];

            if (sql.match(/\bwhere\s*id\s*=/i)) {
              return [
                table.find(({ id }) => id === (values as number[]).at(0)) !=
                null
                  ? { affectedRows: 1 }
                  : { affectedRows: 0 },
                [] as FieldPacket[],
              ];
            }
          }
        }

        throw new Error(`Unhandled query: ${sql}`);
      },
    );
};
