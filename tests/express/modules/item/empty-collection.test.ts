/*
  Purpose:
  Verify that browsing an empty collection is not an error: the client
  (getOrFetch) throws on any non-2xx status, so a 416 would show the
  error page instead of an empty list.
*/

import contracts from "../../../contracts";
import { check, setupMocks } from "../../test-utils";

// Imported lazily: the database mock is registered by test-utils
const { default: database } = await import("../../../../src/database");

describe("Empty collection", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is sent whole: 200 with an empty array", async () => {
    database.exec("delete from item");

    await check(
      {
        ...contracts.items.browse,
        cases: {
          empty: {
            request: { headers: { Range: "items=0-9" } },
            response: {
              status: 200,
              body: [],
              headers: { "content-range": "items */0" },
            },
          },
        },
      },
      "empty",
    );
  });

  it("still answers 416 to a range beyond a non-empty collection", async () => {
    await check(contracts.items.browse, "out_of_range");
  });
});
