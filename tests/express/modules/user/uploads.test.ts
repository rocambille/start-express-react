/*
  Purpose:
  Verify that an existing uploaded file is served to authenticated users
  only (the users contract covers 401 and 404, not an actual file).
*/

import fs from "node:fs";
import path from "node:path";

import contracts from "../../../contracts";
import { standardUser } from "../../../fixtures/users";
import { check, setupMocks } from "../../test-utils";

const { UPLOADS_DIR } = await import("../../../../src/express/helpers/upload");

const file = path.join(UPLOADS_DIR, "avatars/private-probe.webp");

const read = (jwtPayload: Case["request"]["jwtPayload"], status: number) =>
  check(
    {
      ...contracts.users.read_upload,
      cases: {
        current: {
          specialPath: "/uploads/avatars/private-probe.webp",
          request: jwtPayload === undefined ? {} : { jwtPayload },
          response: { status, body: expect.anything() },
        },
      },
    },
    "current",
  );

describe("Uploaded files", () => {
  beforeEach(() => {
    setupMocks();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "RIFF-probe");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(file, { force: true });
  });

  it("are served to authenticated users", async () => {
    const response = await read({ sub: standardUser.id }, 200);

    expect(response.headers["content-type"]).toBe("image/webp");
  });

  it("are not served without a session", async () => {
    await read(undefined, 401);
  });
});
