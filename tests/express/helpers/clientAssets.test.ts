/*
  Purpose:
  Unit tests for the production client assets middleware.

  Strategy:
  - Serve a temporary folder shaped like dist/client
  - Requests the middleware does not handle fall through to a marker
    handler, standing for the SSR catch-all
*/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import supertest from "supertest";

import { clientAssets } from "../../../src/express/helpers/clientAssets";

describe("clientAssets", () => {
  let directory: string;
  let api: ReturnType<typeof supertest>;

  beforeAll(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "client-"));
    fs.writeFileSync(path.join(directory, "index.html"), "<!--ssr-outlet-->");
    fs.mkdirSync(path.join(directory, "assets"));
    fs.writeFileSync(path.join(directory, "assets/app.js"), "console.log(1)");
    fs.writeFileSync(path.join(directory, "about.html"), "static page");

    const app = express();
    app.use(clientAssets(directory));
    app.use((_req, res) => {
      res.send("server-side rendering");
    });

    api = supertest(app);
  });

  afterAll(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("leaves the home page to server-side rendering", async () => {
    const response = await api.get("/");

    expect(response.text).toBe("server-side rendering");
  });

  it("serves built assets", async () => {
    const response = await api.get("/assets/app.js");

    expect(response.status).toBe(200);
    expect(response.text).toBe("console.log(1)");
  });

  it("does not resolve pages to .html files", async () => {
    const response = await api.get("/about");

    expect(response.text).toBe("server-side rendering");
  });

  it.each(["/index.html", "/%69ndex.html", "/INDEX.HTML", "/about.html"])(
    "leaves %s to server-side rendering",
    async (url) => {
      const response = await api.get(url);

      expect(response.text).toBe("server-side rendering");
    },
  );

  it("does not fail on a malformed URL", async () => {
    const response = await api.get("/%E0%A4%A");

    expect(response.status).toBeLessThan(500);
  });
});
