/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    fs: {
      /*
        In development, Vite serves any project file by its path, and the
        server listens on every network interface: without this list,
        GET /data/sqlite/database.sqlite downloads the database.
        Vite's defaults are repeated because this list replaces them.
      */
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/data/**"],
    },
  },
  test: {
    globals: true,
    typecheck: { tsconfig: "./tsconfig.test.json" },
    projects: [
      {
        extends: true,
        test: {
          include: ["**/*.test.ts"],
          environment: "node",
          name: "node",
          env: loadEnv(mode, process.cwd(), ""),
        },
      },
      {
        extends: true,
        test: {
          include: ["**/*.test.tsx"],
          environment: "jsdom",
          name: "jsdom",
        },
      },
    ],
    coverage: {
      exclude: [
        "tests/contracts/**",
        "tests/fixtures/**",
        "tests/**/test-utils.ts*",
      ],
    },
  },
}));
