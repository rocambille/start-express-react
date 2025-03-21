import { Transform } from "node:stream";
import type { Request, Response } from "express";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";

import routes from "./react/routes";

const { query, dataRoutes } = createStaticHandler(routes);

export const render = async (template: string, req: Request, res: Response) => {
  // 1. run actions/loaders to get the routing context with `query`
  const context = await query(
    new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`),
  );

  // If `query` returns a Response, send it raw
  if (context instanceof Response) {
    for (const [key, value] of context.headers.entries()) {
      res.set(key, value);
    }

    return res.status(context.status).end(context.body);
  }

  // Setup headers from action and loaders from deepest match
  const leaf = context.matches[context.matches.length - 1];
  const actionHeaders = context.actionHeaders[leaf.route.id];
  if (actionHeaders) {
    for (const [key, value] of actionHeaders.entries()) {
      res.set(key, value);
    }
  }
  const loaderHeaders = context.loaderHeaders[leaf.route.id];
  if (loaderHeaders) {
    for (const [key, value] of loaderHeaders.entries()) {
      res.set(key, value);
    }
  }

  // 2. Create a static router for SSR
  const router = createStaticRouter(dataRoutes, context);

  // 3. Render everything with StaticRouterProvider
  const { pipe } = renderToPipeableStream(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
  );

  // 4. send a response
  res.status(200).set("Content-Type", "text/html; charset=utf-8");

  const [htmlStart, htmlEnd] = template.split("<!--ssr-outlet-->");

  res.write(htmlStart);

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      res.write(chunk, encoding);
      callback();
    },
  });

  pipe(transformStream);

  transformStream.on("finish", () => {
    res.end(htmlEnd);
  });
};
