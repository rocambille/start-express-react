/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    globals: true,
    env: loadEnv(mode, process.cwd(), ""),
    typecheck: { tsconfig: "./tsconfig.test.json" },
    projects: [
      {
        extends: true,
        test: {
          include: ["**/*.test.ts"],
          environment: "node",
          name: "node",
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
        "tests/**/contracts",
        "tests/**/fixtures",
        "tests/**/test-utils*.ts",
      ],
    },
  },
}));
