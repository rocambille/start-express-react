// Get variables from .env file for database connection
const { MYSQL_ROOT_PASSWORD, MYSQL_DATABASE } = process.env;

// Create a connection pool to the database
import mysql from "mysql2/promise";

/* ************************************************************************ */

const client = mysql.createPool(
  `mysql://root:${MYSQL_ROOT_PASSWORD}@database:3306/${MYSQL_DATABASE}`,
);

/* ************************************************************************ */

// Ready to export
export default client;

// Types export
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type DatabaseClient = Pool;
type Result = ResultSetHeader;
type Rows = RowDataPacket[];

export type { DatabaseClient, Result, Rows };
