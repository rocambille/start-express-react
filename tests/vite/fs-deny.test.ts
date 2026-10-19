/*
  Purpose:
  Verify that the Vite dev server never serves the private files under
  data/ (SQLite database, uploaded files, mails).

  Strategy:
  - Start Vite in middleware mode, as server.ts does in development
  - Request files that exist on disk, by their project path
*/

import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import { createServer, type ViteDevServer } from "vite";

const root = path.join(import.meta.dirname, "../..");
const probe = path.join(root, "data/sqlite/vite-deny-probe.sqlite");

describe("Vite dev server file access", () => {
  let vite: ViteDevServer;

  beforeAll(async () => {
    fs.mkdirSync(path.dirname(probe), { recursive: true });
    fs.writeFileSync(probe, "SQLite format 3");

    vite = await createServer({
      root,
      configFile: path.join(root, "vite.config.ts"),
      server: { middlewareMode: true, hmr: false },
      appType: "custom",
      logLevel: "silent",
    });
  });

  afterAll(async () => {
    await vite.close();
    fs.rmSync(probe, { force: true });
  });

  it("does not serve the database", async () => {
    const response = await supertest(vite.middlewares).get(
      "/data/sqlite/vite-deny-probe.sqlite",
    );

    expect(response.status).toBe(403);
    expect(response.text).not.toContain("SQLite format 3");
  });

  it("still serves source modules", async () => {
    const response = await supertest(vite.middlewares).get(
      "/src/entry-client.tsx",
    );

    expect(response.status).toBe(200);
  });
});
