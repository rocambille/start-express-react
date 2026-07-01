/*
  Purpose:
  Define the API contracts for the StartER framework.

  What are Contracts?
  - A central, declarative "Point of Truth" for API behavior.
  - Separates test data (what?) from test logic (how?).
  - Serves as living documentation for developers and students.

  Structure:
  - Contract: a collection of related Tests (e.g., "items", "auth")
  - Test: a specific endpoint and method
  - Case: a scenario (e.g., "success", "unauthorized", "bad_request")

  Conventions:
  - Ordered by status code (ascending)
  - Error names follow HTTP status text in snake_case
*/

import path from "node:path";

const context = import.meta.glob<true, string, Contract>("./*.ts", {
  import: "default",
  eager: true,
});

const contracts = Object.entries(context).reduce<Record<string, Contract>>(
  (acc, [fileName, contract]) => {
    const contractName = path.basename(fileName, ".ts");
    acc[contractName] = contract;
    return acc;
  },
  {},
);

export default contracts;
