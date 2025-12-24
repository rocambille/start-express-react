/*
  Purpose:
  Perform a lightweight, early database connectivity check at startup.

  This module:
  - Attempts to acquire a single connection from the MySQL pool
  - Logs a clear message indicating whether the database is reachable
  - Releases the connection immediately after the check

  This module intentionally does NOT:
  - Block application startup on database failure
  - Retry connections or manage reconnection logic
  - Crash the process if the database is unavailable

  Design rationale:
  - StartER supports workflows where the API may be started
    before the database is fully available (e.g. first install, CI, SSR-only usage)
  - A warning is sufficient to alert developers without preventing
    unrelated parts of the application from running
*/

/* ************************************************************************ */
/* Database connectivity check                                              */
/* ************************************************************************ */

import client from "./client";

/*
  Attempt to retrieve a connection from the pool.

  Success:
  - Logs the database name being used
  - Releases the connection immediately

  Failure:
  - Emits a warning with actionable guidance
  - Does not throw or exit the process
*/
client
  .getConnection()
  .then((connection) => {
    console.info(`Using database ${process.env.MYSQL_DATABASE}`);

    connection.release();
  })
  .catch((err: Error) => {
    console.warn(
      "Warning:",
      "Failed to establish a database connection.",
      "Please check your database credentials in the .env file if you need database access.",
    );

    console.warn(err.message);
  });
