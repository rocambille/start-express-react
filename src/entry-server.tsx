import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from "react-router";

import routes from "./react/routes";

export const render = async (
  fullUrl: string,
  options?: RenderToPipeableStreamOptions,
) => {
  const { query, dataRoutes } = createStaticHandler(routes);

  const context = await query(new Request(fullUrl));

  if (context instanceof Response) {
    throw new Error("React Router stuff to handle");

    // return context;
  }

  const router = createStaticRouter(dataRoutes, context);

  return renderToPipeableStream(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} />
    </StrictMode>,
    options,
  );
};
