/*
  Purpose:
  Central UI routing entry point for the React application.

  Responsibilities:
  - Define the root layout of the application
  - Compose feature modules (e.g. items)

  Design notes:
  - Routes are declared explicitly (no automatic discovery)
  - Feature modules expose their own route fragments

  This file is shared by:
  - entry-client.tsx (client-side routing & hydration)
  - entry-server.tsx (server-side rendering & data loading)

  Related docs:
  - https://reactrouter.com/start/data/routing
  - https://expressjs.com/en/guide/using-middleware.html
*/

import { Outlet, type RouteObject } from "react-router";

import Home from "./components/Home";
import { itemRoutes } from "./components/item/index";
import Layout from "./components/Layout";

/*
  Global styles
  Loaded once at the routing level to ensure consistency
  across all routes and layouts
*/
import "./index.css";

/* ************************************************************************ */
/* Routes definition                                                        */
/* ************************************************************************ */

const routes: RouteObject[] = [
  {
    /*
      Root route:
      - Wraps all pages with the global <Layout>
      - Uses <Outlet> to render child routes
    */
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),

    /*
      Nested routes:
      - index route: Home page
      - feature routes: imported and spread from modules
    */
    children: [
      {
        index: true,
        element: <Home />,
      },
      ...itemRoutes,
    ],
  },
];

export default routes;
