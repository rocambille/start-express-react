import express from "express";
import fs from "node:fs";
import path from "node:path";
import { Transform } from "node:stream";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";

import "./src/database/checkConnection";

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
      const getTemplateAndRender = async () => {
        if (isProduction) {
          const render = (await import("./dist/server/entry-server")).render;
          return { template: cachedTemplate, render };
        }

        // 1. Read index.html
        let template = fs.readFileSync(
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
        const render = (
          await (vite as ViteDevServer).ssrLoadModule("/src/entry-server")
        ).render;

        return { template, render };
      };

      const { template, render } = await getTemplateAndRender();

      // 4. render the app HTML. This assumes entry-server.js's exported
      //     `render` function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const { pipe } = await render(
        `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      );

      res.status(200);

      res.set({ "Content-Type": "text/html" });

      const transformStream = new Transform({
        transform(chunk, encoding, callback) {
          res.write(chunk, encoding);
          callback();
        },
      });

      // 5. Inject the app-rendered HTML into the template.
      const [htmlStart, htmlEnd] = template.split("<!--ssr-outlet-->");

      res.write(htmlStart);

      transformStream.on("finish", () => {
        res.end(htmlEnd);
      });

      pipe(transformStream);
    } catch (error) {
      // If an error is caught, let Vite fix the stack trace so it maps back
      // to your actual source code.
      vite?.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  const port = 5173;

  app.listen(port, () => {
    console.info(`Listening on port ${port}`);
  });
}

createServer();
