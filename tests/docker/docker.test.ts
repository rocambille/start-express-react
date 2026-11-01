/*
  Purpose:
  Keep the Docker files consistent with each other: a mismatch silently
  loses data or bakes secrets into the image.

  Strategy:
  - Read Dockerfile, .dockerignore, compose files and package.json
  - No Docker needed: these are static checks
*/

import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "../..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const workdir = read("Dockerfile").match(/^WORKDIR (.+)$/m)?.[1];

describe("Docker setup", () => {
  it("has a working directory", () => {
    expect(workdir).toBe("/home/app");
  });

  it("mounts the production data volume on the working directory", () => {
    // Otherwise the database lives in the container and is lost on rebuild
    expect(read("compose.prod.yaml")).toContain(`./data:${workdir}/data`);
  });

  it("mounts the development source on the working directory", () => {
    expect(read("compose.yaml")).toContain(`".:${workdir}"`);
  });

  it("keeps secrets and data out of the image", () => {
    const ignored = read(".dockerignore").split("\n");

    expect(ignored).toContain("**/.env");
    expect(ignored).toContain("**/.env.*");
    expect(ignored).toContain("data");
  });

  it("does not run as root", () => {
    expect(read("Dockerfile")).toMatch(/^USER node$/m);
  });

  it("installs dependencies as the node user", () => {
    // A chown -R after npm ci copies node_modules into another layer
    const dockerfile = read("Dockerfile");

    expect(dockerfile.indexOf("USER node")).toBeGreaterThan(-1);
    expect(dockerfile.indexOf("USER node")).toBeLessThan(
      dockerfile.indexOf("npm ci"),
    );
    expect(dockerfile).not.toMatch(/chown -R/);
  });

  it("starts without a .env file (settings from the container)", () => {
    const { scripts } = JSON.parse(read("package.json"));

    expect(scripts.start).toContain("--env-file-if-exists=.env");
    expect(scripts["database:migrate"]).toContain("--env-file-if-exists=.env");
  });

  it("reads production settings from .env at runtime", () => {
    expect(read("compose.prod.yaml")).toMatch(/^\s+env_file: \.env$/m);
  });
});
