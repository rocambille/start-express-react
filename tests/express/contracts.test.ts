/*
  Purpose:
  Main entry point for contract-driven testing.

  This file:
  - Iterates over all contracts defined in tests/contracts.ts
  - Dynamically creates Vitest tests for every case
  - Handles mock setup and cleanup for each test

  Why this is powerful:
  - New endpoints only require data definitions, not new test files
  - Guarantees 100% test coverage consistency
  - Decouples API contract from implementation details
*/

import { contracts } from "../contracts";
import { check, setupMocks } from "./test-utils";

describe("API Contracts", () => {
  /*
    Setup:
    Ensure a clean state for every single test case.
  */
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /*
    Generation:
    Loop through every contract -> test -> case.
  */
  for (const [contractName, contract] of Object.entries(contracts)) {
    describe(contractName, () => {
      for (const [testName, test] of Object.entries(contract)) {
        describe(testName, () => {
          for (const [caseName, c] of Object.entries(test.cases)) {
            (c.only ? it.only : it)(caseName, async () => {
              await check(test, caseName);
            });
          }
        });
      }
    });
  }
});
