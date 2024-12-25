import type { Request, Response } from "express";
import { Transform } from "node:stream";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router";

import routes from "./react/routes";

export const render = async (template: string, req: Request, res: Response) => {
  const { query, dataRoutes } = createStaticHandler(routes);

  const context = await query(
    new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`),
  );

  if (context instanceof Response) {
    throw new Error("React Router stuff to handle");
  }

  const router = createStaticRouter(dataRoutes, context);

  const { pipe } = renderToPipeableStream(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
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
};
