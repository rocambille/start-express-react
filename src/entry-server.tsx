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

export const render = async (template: string, req: Request, res: Response) => {
  const { query, dataRoutes } = createStaticHandler(routes);

  const context = await query(
    new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`),
  );

  if (context instanceof Response) {
    for (const [key, value] of context.headers.entries()) {
      res.set(key, value);
    }

    return res.status(context.status).end(context.body);
  }

  const router = createStaticRouter(dataRoutes, context);

  const { pipe } = renderToPipeableStream(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
  );

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

  res.status(200);

  res.set("Content-Type", "text/html; charset=utf-8");

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      res.write(chunk, encoding);
      callback();
    },
  });

  const [htmlStart, htmlEnd] = template.split("<!--ssr-outlet-->");

  res.write(htmlStart);

  transformStream.on("finish", () => {
    res.end(htmlEnd);
  });

  pipe(transformStream);
};
