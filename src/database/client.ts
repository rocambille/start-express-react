/*
  Purpose:
  Provide a single, shared MySQL connection pool for the entire application.

  This module:
  - Reads database connection parameters from environment variables
  - Creates a MySQL connection pool using mysql2/promise
  - Exposes typed helpers for query results

  This module intentionally does NOT:
  - Manage migrations or schema creation
  - Hide SQL behind abstractions or ORMs
  - Add retry or reconnection logic (delegated to mysql2)

  Design rationale:
  - Using raw SQL keeps data access explicit and predictable
  - A shared pool is sufficient for most workloads and easy to reason about
*/

/* ************************************************************************ */
/* Environment configuration                                                */
/* ************************************************************************ */

/*
  Required environment variables.

  These must be defined in the `.env` file or environment:
  - MYSQL_ROOT_PASSWORD
  - MYSQL_DATABASE

  The application will fail early if they are missing,
  which is intentional to avoid undefined runtime behavior.
*/
const { MYSQL_ROOT_PASSWORD, MYSQL_DATABASE } = process.env;

/* ************************************************************************ */
/* MySQL client                                                             */
/* ************************************************************************ */

import mysql from "mysql2/promise";

/*
  Create a MySQL connection pool.

  Notes:
  - Uses the mysql2 promise-based API
  - The hostname `database` assumes a Docker-based setup
  - Connection pooling is handled internally by mysql2
*/
const client = mysql.createPool(
  `mysql://root:${MYSQL_ROOT_PASSWORD}@database:3306/${MYSQL_DATABASE}`,
);

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

/*
  Default export:
  - The connection pool itself
  - Used directly by repositories to execute SQL queries
*/
export default client;

/*
  Type exports:
  - Exposed to keep repository code explicit and type-safe
  - Avoids leaking mysql2 internals throughout the codebase
*/
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type DatabaseClient = Pool;
type Result = ResultSetHeader;
type Rows = RowDataPacket[];

export type { DatabaseClient, Result, Rows };
