import React from "react";
import { Outlet } from "react-router";

import { ItemProvider } from "./ItemContext";
import ItemCreate from "./ItemCreate";
import ItemEdit from "./ItemEdit";
import ItemList from "./ItemList";
import ItemShow from "./ItemShow";

export const itemRoutes = {
  path: "/items",
  element: (
    <React.Suspense fallback={<p>loading items...</p>}>
      <ItemProvider>
        <Outlet />
      </ItemProvider>
    </React.Suspense>
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
};
