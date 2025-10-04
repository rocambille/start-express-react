import { Suspense } from "react";
import { Outlet } from "react-router";

import { ItemProvider } from "./components/ItemContext";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import ItemCreate from "./pages/ItemCreate";
import ItemEdit from "./pages/ItemEdit";
import ItemList from "./pages/ItemList";
import ItemShow from "./pages/ItemShow";

import ShowcasePage from './pages/Showcase';

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
       path: "/showcase",
       element: <ShowcasePage />,
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
            path: "/items/new",
            element: <ItemCreate />,
          },
          {
            path: "/items/:id/edit",
            element: <ItemEdit />,
          },
          {
            index: true,
            element: <ItemList />,
          },
          {
            path: "/items/:id",
            element: <ItemShow />,
          },
        ],
      },
    ],
  },
];
