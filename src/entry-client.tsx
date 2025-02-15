const root = document.getElementById("root");

if (root == null) {
  throw new Error("Element with id root is missing in index.html");
}

import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  RouterProvider,
  type RouterState,
  createBrowserRouter,
} from "react-router";

import routes from "./react/routes";

const router = createBrowserRouter(routes, {
  hydrationData: (
    window as typeof window & {
      __staticRouterHydrationData: Partial<
        Pick<RouterState, "loaderData" | "actionData" | "errors">
      >;
    }
  ).__staticRouterHydrationData,
});

hydrateRoot(
  root,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
