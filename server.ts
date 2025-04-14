import fs from "node:fs";
import express, { type ErrorRequestHandler, type Express } from "express";
import { rateLimit } from "express-rate-limit";
import { createServer as createViteServer } from "vite";

import "./src/database/checkConnection";

const port = 5173;

createServer().then((server) => {
  server.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`);
  });
});

async function createServer() {
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // max 100 requests per windowMs
  });

  app.use(limiter);

  app.use((await import("./src/express/routes")).default);

  const maybeVite = await configure(app);

  app.use(/(.*)/, async (req, res, next) => {
    const url = req.originalUrl;

    // The fetch api is ambiguous and depends on the context where it is executed :

    // * in the browser, it will refer to the fetch API from window
    //   => fetch("/api") is working
    // * on the server (and build phase), it will refer to the fetch API from node
    //   => fetch("/api") is not working

    // SSR is using node API here, so we need to fix fetch for non-absolute urls :
    {
      const nodeFetch = globalThis.fetch;

      globalThis.fetch = (resource) =>
        nodeFetch(
          new URL(resource.toString(), `http://localhost:${port}${url}`),
        );

      // URL constructor manages relative/absolute paths all by itself,
      // so with base = http://localhost:${port}${url} :
      // * if resource = "/foo",
      //   then URL = http://localhost:${port}/foo
      // * if resource = "./bar",
      //   then URL = http://localhost:${port}${url}./bar
      // * if resource = "http://example.com/baz",
      //   then URL = http://example.com/baz
    }

    try {
      const getTemplateAndRender = async () => {
        const indexHtml = readIndexHtml();

        if (maybeVite == null) {
          // Note: ./dist/server/entry-server doesn't exist *before* build
          // @ts-expect-error
          const { render } = await import("./dist/server/entry-server");

          return { template: indexHtml, render };
        }

        const vite = maybeVite;

        // 1. Apply Vite HTML transforms. This injects the Vite HMR client,
        //    and also applies HTML transforms from Vite plugins, e.g. global
        //    preambles from @vitejs/plugin-react
        const template = await vite.transformIndexHtml(url, indexHtml);

        // 2. Load the server entry. ssrLoadModule automatically transforms
        //    ESM source code to be usable in Node.js! There is no bundling
        //    required, and provides efficient invalidation similar to HMR.
        const { render } = await vite.ssrLoadModule("/src/entry-server");

        return { template, render };
      };

      const { template, render } = await getTemplateAndRender();

      // 3. render the app HTML. This assumes entry-server.js's exported
      //     `render` function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      await render(template, req, res);
    } catch (error) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      maybeVite?.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  const logErrors: ErrorRequestHandler = (err, req, _res, next) => {
    console.error(err);
    console.error("on req:", req.method, req.path);

    next(err);
  };

  app.use(logErrors);

  return app;
}

const isProduction = process.env.NODE_ENV === "production";

function readIndexHtml() {
  return fs.readFileSync(
    isProduction ? "dist/client/index.html" : "index.html",
    "utf-8",
  );
}

async function configure(app: Express) {
  if (isProduction) {
    const compression = (await import("compression")).default;

    app.use(compression());
    app.use(express.static("./dist/client", { extensions: [] }));
  } else {
    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Use vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    // When the server restarts (for example after the user modifies
    // vite.config.js), `vite.middlewares` is still going to be the same
    // reference (with a new internal stack of Vite and plugin-injected
    // middlewares). The following is valid even after restarts.
    app.use(vite.middlewares);

    return vite;
  }
}
