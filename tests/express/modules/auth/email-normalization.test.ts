/*
  Purpose:
  Verify that emails are compared case-insensitively and without
  surrounding spaces: "Foo@Mail.com " is the account of "foo@mail.com".
*/

import contracts from "../../../contracts";
import { standardUser } from "../../../fixtures/users";
import { check, setupMocks } from "../../test-utils";

// Imported lazily: the database mock is registered by test-utils
const { default: database } = await import("../../../../src/database");

const countUsers = () =>
  Number(database.prepare("select count(*) as total from user").get()?.total);

const tokensOf = (userId: number) =>
  Number(
    database
      .prepare(
        "select count(*) as total from magic_link_token where user_id = ?",
      )
      .get(userId)?.total,
  );

describe("Email normalization", () => {
  beforeEach(() => {
    setupMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("finds the existing account whatever the case and spaces", async () => {
    const users = countUsers();
    const tokens = tokensOf(standardUser.id);

    await check(
      {
        ...contracts.auth.magic_link,
        cases: {
          current: {
            request: {
              body: { email: ` ${standardUser.email.toUpperCase()} ` },
            },
            response: { status: 204, body: {} },
          },
        },
      },
      "current",
    );

    expect(countUsers()).toBe(users);
    expect(tokensOf(standardUser.id)).toBe(tokens + 1);
  });

  it("stores the email of a new account in lowercase", async () => {
    await check(
      {
        ...contracts.auth.magic_link,
        cases: {
          current: {
            request: { body: { email: " New.User@Mail.com" } },
            response: { status: 204, body: {} },
          },
        },
      },
      "current",
    );

    const row = database
      .prepare("select email from user order by id desc limit 1")
      .get();

    expect(row?.email).toBe("new.user@mail.com");
  });

  it("normalizes the email when the user edits it", async () => {
    await check(
      {
        ...contracts.users.edit_me,
        cases: {
          current: {
            request: {
              body: { email: " Updated@Mail.com ", name: "updated" },
              jwtPayload: { sub: standardUser.id },
            },
            response: { status: 204, body: {} },
          },
        },
      },
      "current",
    );

    const row = database
      .prepare("select email from user where id = ?")
      .get(standardUser.id);

    expect(row?.email).toBe("updated@mail.com");
  });
});
