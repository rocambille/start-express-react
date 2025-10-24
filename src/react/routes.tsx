import { Outlet } from "react-router";
import Home from "./components/Home";
import { itemRoutes } from "./components/item";
import Layout from "./components/Layout";

import "./index.css";

export default [
  {
    path: "/",
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      ...itemRoutes,
    ],
  },
];
