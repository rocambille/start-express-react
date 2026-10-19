/*
  Purpose:
  Keep the contract Case type able to describe every JSON response,
  including null (e.g. "no resource yet" answered as 200 null).

  Checked by types:check (tsc), which type-checks tests.
*/

describe("Case type", () => {
  it("accepts a null response body", () => {
    const nothingYet: Case = {
      request: {},
      response: { status: 200, body: null },
    };

    expect(nothingYet.response.body).toBeNull();
  });
});
