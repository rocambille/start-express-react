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

import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import express, { type ErrorRequestHandler, type Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";

/**
 * Patch globalThis.fetch to support relative URLs during SSR.
 *
 * In Node.js:
 * - fetch("/api") throws "Absolute URL required"
 * - We need to resolve relative URLs against the request URL
 *
 * Solution:
 * - Create a storage that holds the base URL for the current request
 * - Patch fetch to resolve relative URLs against this base URL
 */
const fetchBaseStorage = new AsyncLocalStorage<{
  base: string;
  cookie?: string;
}>();

const nodeFetch = globalThis.fetch;

globalThis.fetch = (resource, init) => {
  const store = fetchBaseStorage.getStore();

  // 1. Resolve relative URLs against the request base URL
  const url = store?.base ? new URL(resource.toString(), store.base) : resource;

  // 2. Forward cookies for internal API calls (relative paths) during SSR
  // Security: Only forward for relative paths starting with "/" but not "//"
  // to avoid leaking cookies to external domains via protocol-relative URLs.
  const isInternal =
    typeof resource === "string" &&
    resource.startsWith("/") &&
    !resource.startsWith("//");

  if (isInternal && store?.cookie) {
    const headers = new Headers(init?.headers);
    if (!headers.has("cookie")) {
      headers.set("cookie", store.cookie);
    }
    return nodeFetch(url, { ...init, headers });
  }

  return nodeFetch(url, init);
};

/* ************************************************************************ */
/*                                  Startup                                 */
/* ************************************************************************ */

const isProduction = process.env.NODE_ENV === "production";

const port = +(process.env.APP_PORT ?? 5173);

const indexHtml = readIndexHtml();

// Server creation is async because it may initialize Vite in dev mode
createServer().then((server) => {
  server.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`);
  });
});

/* ************************************************************************ */
/*                             Server creation                              */
/* ************************************************************************ */

export async function createServer() {
  const app = express();

  /* ********************************************************************** */
  /* Helmet                                                                 */
  /* ********************************************************************** */

  // SECURITY:
  // Sets HTTP response headers such as Content-Security-Policy and
  // Strict-Transport-Security. See https://helmetjs.github.io/ for details.
  //
  // Content-Security-Policy is enabled only in production.
  // In development it is disabled because Vite’s HMR relies on
  // WebSocket connections and dynamic module evaluation, which
  // are blocked by Helmet’s default CSP.
  app.use(
    helmet({
      contentSecurityPolicy: isProduction,
    }),
  );

  /* ********************************************************************** */
  /* Rate limiting                                                          */
  /* ********************************************************************** */

  // SECURITY:
  // Basic rate limiting to mitigate brute-force and abuse.
  // This is intentionally simple and should be tuned per deployment.
  if (isProduction) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // max 100 requests per window
    });

    app.use(limiter);
  }

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

  /* ****************************************************************** */
  /* Load HTML template and SSR renderer                                */
  /* ****************************************************************** */

  const getTemplateAndRender = async (url: string) => {
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

  // Catch-all handler for SSR
  app.use(/(.*)/, async (req, res, next) => {
    const url = req.originalUrl;
    const base = `http://localhost:${port}${url}`;
    const cookie = req.headers.cookie;

    fetchBaseStorage.run({ base, cookie }, async () => {
      try {
        // Prevent caching of the HTML page
        // SSR is auth-aware and must not be cached
        res.set("Cache-Control", "private, no-store");

        /* **************************************************************** */
        /* Render application                                               */
        /* **************************************************************** */

        const { template, render } = await getTemplateAndRender(url);

        // The render function is responsible for:
        // - Rendering the React app
        // - Injecting HTML into the template
        // - Sending the response
        await render(template, req, res);
      } catch (err) {
        // DEV EXPERIENCE:
        // Let Vite rewrite stack traces so they map to source files.
        if (err instanceof Error) maybeVite?.ssrFixStacktrace(err);
        next(err);
      }
    });
  });

  /* ********************************************************************** */
  /* Error handling                                                         */
  /* ********************************************************************** */

  /*
    Error logging middleware:
    Logs errors for debugging, then passes them to the error response handler.
  */
  const logErrors: ErrorRequestHandler = (err, req, _res, next) => {
    console.error(err);
    console.error("on req:", req.method, req.path);

    next(err);
  };

  /*
    Final error handler:
    Sends a structured JSON response instead of Express's default HTML page.
    Stack traces are hidden in production to avoid leaking implementation details.
  */
  const sendErrors: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500;

    res.status(status).json({
      message: err.message ?? "Internal Server Error",
      ...(isProduction ? {} : { stack: err.stack }),
    });
  };

  app.use(logErrors);
  app.use(sendErrors);

  return app;
}

/* ************************************************************************ */
/*                              Helper utils                                */
/* ************************************************************************ */

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
