/**
 * Purpose:
 * Main application entry point.
 *
 * Responsibilities:
 * - Create and configure the Express server
 * - Mount API routes
 * - Integrate Vite for SSR in development
 * - Serve static assets in production
 *
 * Design notes:
 * - Single server for API + SSR
 * - Fully stateless backend
 * - No Express sessions
 *
 * Related docs:
 * - https://expressjs.com/
 * - https://vitejs.dev/guide/ssr
 */

import fs from "node:fs";
import express, { type ErrorRequestHandler, type Express } from "express";
import { rateLimit } from "express-rate-limit";
import { createServer as createViteServer } from "vite";

// NOTE:
// This import is executed for its side effects only.
// It ensures the database connection is validated at startup.
import "./src/database/checkConnection";

/* ************************************************************************ */
/*                                  Startup                                 */
/* ************************************************************************ */

const port = +(process.env.APP_PORT ?? 5173);

// Server creation is async because it may initialize Vite in dev mode
createServer().then((server) => {
  server.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`);
  });
});

/* ************************************************************************ */
/*                             Server creation                              */
/* ************************************************************************ */

async function createServer() {
  const app = express();

  /* ********************************************************************** */
  /* Rate limiting                                                          */
  /* ********************************************************************** */

  // SECURITY:
  // Basic rate limiting to mitigate brute-force and abuse.
  // This is intentionally simple and should be tuned per deployment.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // max 100 requests per window
  });

  app.use(limiter);

  /* ********************************************************************** */
  /* API routes                                                             */
  /* ********************************************************************** */

  // All API routes are mounted here.
  // They are isolated, stateless, and independently testable.
  app.use((await import("./src/express/routes")).default);

  /* ********************************************************************** */
  /* Frontend / SSR configuration                                           */
  /* ********************************************************************** */

  const maybeVite = await configure(app);

  // Catch-all handler for SSR
  app.use(/(.*)/, async (req, res, next) => {
    const url = req.originalUrl;

    /* ******************************************************************** */
    /* Fix fetch behavior during SSR                                        */
    /* ******************************************************************** */

    // NOTE:
    // The Fetch API behaves differently depending on the runtime:
    //
    // - Browser: fetch("/api") works (relative to current origin)
    // - Node.js: fetch("/api") is invalid (no implicit base URL)
    //
    // During SSR, we run in Node.js, so we patch fetch to resolve
    // relative URLs against the current request URL.

    {
      const nodeFetch = globalThis.fetch;

      globalThis.fetch = (resource) =>
        nodeFetch(
          new URL(resource.toString(), `http://localhost:${port}${url}`),
        );

      // TIP:
      // The URL constructor handles absolute vs relative paths automatically:
      //
      // base = http://localhost:5173/some/page
      // - "/foo"        -> http://localhost:5173/foo
      // - "./bar"       -> http://localhost:5173/some/page/bar
      // - "http://x.y"  -> http://x.y
    }

    try {
      /* **************************************************************** */
      /* Load HTML template and SSR renderer                              */
      /* **************************************************************** */

      const getTemplateAndRender = async () => {
        const indexHtml = readIndexHtml();

        // Production mode:
        // SSR bundle is prebuilt and loaded from dist/
        if (maybeVite == null) {
          // NOTE:
          // This file does not exist before the build step.
          // @ts-expect-error - runtime-only import
          const { render } = await import("./dist/server/entry-server");

          return { template: indexHtml, render };
        }

        // Development mode:
        // Vite handles on-the-fly module loading and HMR
        const vite = maybeVite;

        // 1. Apply Vite HTML transforms (HMR client, plugin hooks, etc.)
        const template = await vite.transformIndexHtml(url, indexHtml);

        // 2. Load the SSR entry module via Vite
        const { render } = await vite.ssrLoadModule("/src/entry-server");

        return { template, render };
      };

      const { template, render } = await getTemplateAndRender();

      /* **************************************************************** */
      /* Render application                                               */
      /* **************************************************************** */

      // The render function is responsible for:
      // - Rendering the React app
      // - Injecting HTML into the template
      // - Sending the response
      await render(template, req, res);
    } catch (err) {
      // DEV EXPERIENCE:
      // Let Vite rewrite stack traces so they map to source files.
      if (err instanceof Error) {
        maybeVite?.ssrFixStacktrace(err);
      }
      next(err);
    }
  });

  /* ********************************************************************** */
  /* Error handling                                                         */
  /* ********************************************************************** */

  const logErrors: ErrorRequestHandler = (err, req, _res, next) => {
    console.error(err);
    console.error("on req:", req.method, req.path);

    next(err);
  };

  app.use(logErrors);

  return app;
}

/* ************************************************************************ */
/*                              Helper utils                                */
/* ************************************************************************ */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Reads the HTML template depending on the environment.
 *
 * - Development: unbuilt index.html
 * - Production: generated dist/client/index.html
 */
function readIndexHtml() {
  return fs.readFileSync(
    isProduction ? "dist/client/index.html" : "index.html",
    "utf-8",
  );
}

/**
 * Configure frontend serving depending on environment.
 *
 * - Production:
 *   - Enable compression
 *   - Serve static assets
 *
 * - Development:
 *   - Create a Vite dev server in middleware mode
 *   - Let Express control routing
 */
async function configure(app: Express) {
  if (isProduction) {
    const compression = (await import("compression")).default;

    app.use(compression());
    app.use(express.static("./dist/client", { extensions: [] }));
  } else {
    // Create Vite server in middleware mode.
    // Express remains the main HTTP server.
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // NOTE:
    // vite.middlewares remains stable across restarts,
    // even if Vite internally reloads plugins or config.
    app.use(vite.middlewares);

    return vite;
  }
}
