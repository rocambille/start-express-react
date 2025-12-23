/*
  Purpose:
  Client-side entry point for the React application.

  Responsibilities:
  - Locate the server-rendered root element
  - Recreate the router with hydration data
  - Hydrate the existing HTML instead of re-rendering it

  Design notes:
  - This file runs only in the browser
  - It assumes HTML has already been rendered by the server
  - Any mismatch between server and client output will surface here

  Related docs:
  - https://reactrouter.com/start/data/custom#4-hydrate-in-the-browser
  - https://react.dev/reference/react-dom/client/hydrateRoot
*/

import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  type RouterState,
} from "react-router";

import routes from "./react/routes";

/* ************************************************************************ */
/*                               Root element                               */
/* ************************************************************************ */

/*
  The root element must already exist in index.html.
  In SSR mode, it already contains HTML produced by entry-server.
*/
const root = document.getElementById("root");

if (root == null) {
  throw new Error("Element with id 'root' is missing in index.html");
}

/* ************************************************************************ */
/*                   Router creation with hydration data                    */
/* ************************************************************************ */

/*
  React Router exposes hydration data on the window object when using SSR.

  This data contains:
  - loader results
  - action results
  - routing errors

  Reusing it prevents:
  - double data fetching
  - inconsistent initial renders
*/
const router = createBrowserRouter(routes, {
  hydrationData: (
    window as typeof window & {
      __staticRouterHydrationData: Partial<
        Pick<RouterState, "loaderData" | "actionData" | "errors">
      >;
    }
  ).__staticRouterHydrationData,
});

/* ************************************************************************ */
/*                                Hydration                                 */
/* ************************************************************************ */

/*
  hydrateRoot:
  - attaches React to existing DOM nodes
  - preserves server-rendered markup
  - enables interactivity and navigation

  StrictMode is enabled to:
  - surface unsafe lifecycle patterns
  - help detect side effects early in development
*/
hydrateRoot(
  root,
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
