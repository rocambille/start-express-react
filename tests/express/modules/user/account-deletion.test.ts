/*
  Purpose:
  Verify that a deleted account does not block its email address:
  the same person must be able to sign up again.
*/

import contracts from "../../../contracts";
import { standardUser } from "../../../fixtures/users";
import { check, setupMocks } from "../../test-utils";

// Imported lazily: the database mock is registered by test-utils
const { default: userRepository } = await import(
  "../../../../src/express/modules/user/userRepository"
);

const requestMagicLink = (email: string) =>
  check(
    {
      ...contracts.auth.magic_link,
      cases: {
        current: {
          request: { body: { email } },
          response: { status: 204, body: {} },
        },
      },
    },
    "current",
  );

describe("Account deletion", () => {
  beforeEach(() => {
    setupMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets the same email sign up again", async () => {
    await check(contracts.users.delete_me, "as_me");

    await requestMagicLink(standardUser.email);

    const newAccount = userRepository.findByEmail(standardUser.email);

    expect(newAccount).not.toBeNull();
    expect(newAccount?.id).not.toBe(standardUser.id);
  });

  it("keeps the deleted account out of reach", async () => {
    await check(contracts.users.delete_me, "as_me");

    expect(userRepository.find(standardUser.id)).toBeNull();
  });
});
