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

import LogoutForm from "./components/auth/LogoutForm";
import VerifyPage from "./components/auth/VerifyPage";
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
import { AuthProvider } from "./components/auth/AuthContext";
import { DataRefreshProvider } from "./components/DataRefreshContext";

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
        <AuthProvider initialUser={me}>
          <DataRefreshProvider>
            <Layout />
          </DataRefreshProvider>
        </AuthProvider>
      );
    },
    /*
      Error element: provides an <ErrorPage> for 400s and 500s
    */
    errorElement: <ErrorPage />,
    /*
      Root loader:
      - Fetches the current user from the /api/me endpoint
      - Returns the user to the root component
    */
    loader: async () => {
      const response = await fetch("/api/me");

      const me: User | null = response.ok ? await response.json() : null;

      return { me };
    },
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
      {
        path: "logout",
        element: <LogoutForm />,
      },
      {
        path: "verify",
        element: <VerifyPage />,
      },
      ...itemRoutes,
    ],
  },
];

export default routes;
