import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";

import expressRouter from "./src/express/router";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === "production";

// Cached production assets
const cachedTemplate = isProduction
  ? await fs.readFileSync("./dist/client/index.html", "utf-8")
  : "";

async function createServer() {
  const app = express();

  app.use(expressRouter);

  let vite = null as ViteDevServer | null;

  if (!isProduction) {
    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    vite = await createViteServer({
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
  } else {
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;
    app.use(compression());
    app.use(sirv("./dist/client", { extensions: [] }));
  }

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template = null as string | null;
      let render = null as
        | ((fullUrl: string) => Promise<string | Response>)
        | null;

      if (!isProduction) {
        // 1. Read index.html
        template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8",
        );

        // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
        //    and also applies HTML transforms from Vite plugins, e.g. global
        //    preambles from @vitejs/plugin-react
        template = await (vite as ViteDevServer).transformIndexHtml(
          url,
          template,
        );

        // 3. Load the server entry. ssrLoadModule automatically transforms
        //    ESM source code to be usable in Node.js! There is no bundling
        //    required, and provides efficient invalidation similar to HMR.
        render = (
          await (vite as ViteDevServer).ssrLoadModule("/src/entry-server")
        ).render;
      } else {
        template = cachedTemplate;
        render = (await import("./dist/server/entry-server")).render;
      }

      // 4. render the app HTML. This assumes entry-server.js's exported
      //     `render` function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const responseOrHtml = await (
        render as (fullUrl: string) => Promise<string | Response>
      )(`${req.protocol}://${req.get("host")}${req.originalUrl}`);

      if (responseOrHtml instanceof Response) {
        responseOrHtml.headers.forEach((value, key) => {
          res.set(key, value);
        });

        res.status(responseOrHtml.status).end(responseOrHtml.body);
      } else {
        // 5. Inject the app-rendered HTML into the template.
        const html = template.replace(
          "<!--ssr-outlet-->",
          () => responseOrHtml,
        );

        // 6. Send the rendered HTML back.
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      }
    } catch (error) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      vite?.ssrFixStacktrace(error);
      next(error);
    }
  });

  const port = 5173;

  app.listen(port, () => {
    console.info(`Server is listening on port ${port}`);
  });
}

createServer();
