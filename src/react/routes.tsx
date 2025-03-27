import { Suspense } from "react";
import { Outlet } from "react-router";

import { ItemProvider } from "./components/ItemContext";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import ItemEdit from "./pages/ItemEdit";
import ItemList from "./pages/ItemList";
import ItemCreate from "./pages/ItemCreate";
import ItemShow from "./pages/ItemShow";

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
      {
        path: "/items",
        element: (
          <Suspense fallback={<p>loading items...</p>}>
            <ItemProvider>
              <Outlet />
            </ItemProvider>
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: <ItemList />,
          },
          {
            path: "/items/:id",
            element: <ItemShow />,
          },
          {
            path: "/items/:id/edit",
            element: <ItemEdit />,
          },
          {
            path: "/items/new",
            element: <ItemCreate />,
          },
        ],
      },
    ],
  },
];
