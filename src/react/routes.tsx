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
  - https://reactrouter.com/en/main/start/overview
*/

import { type RouteObject, useLoaderData } from "react-router";

import AccountPage from "./components/auth/AccountPage";
import { MeProvider } from "./components/auth/MeContext";
import VerifyPage from "./components/auth/VerifyPage";
import { DataRefreshProvider } from "./components/DataRefreshContext";
import ErrorPage from "./components/ErrorPage";
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
      Root component:
      Wraps all pages with the global <Layout> and providers
    */
    Component: () => {
      const { me } = useLoaderData<{ me: User | null }>();

      return (
        <MeProvider initialUser={me}>
          <DataRefreshProvider>
            <Layout />
          </DataRefreshProvider>
        </MeProvider>
      );
    },
    /*
      Error element: provides an <ErrorPage> for 400s and 500s
    */
    errorElement: <ErrorPage />,
    /*
      Root loader:
      - Fetches the current user from the /api/users/me endpoint
      - Returns the user to the root component
    */
    loader: async () => {
      const response = await fetch("/api/users/me");

      const me: User | null = response.ok ? await response.json() : null;

      return { me };
    },
    /*
      Nested routes:
      - index route: Home page
      - feature routes: imported and spread from modules

      The pathless wrapper route acts as an error boundary:
      - Catches errors from all child routes (fetch failures, etc.)
      - Renders ErrorPage inside the Layout (NavBar stays visible)
      - No per-route errorElement needed
    */
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "account",
            element: <AccountPage />,
          },
          {
            path: "verify",
            element: <VerifyPage />,
          },
          ...itemRoutes,
        ],
      },
    ],
  },
];

export default routes;
