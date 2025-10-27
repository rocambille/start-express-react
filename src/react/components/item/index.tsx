import type { RouteObject } from "react-router";

import ItemCreate from "./ItemCreate";
import ItemEdit from "./ItemEdit";
import ItemList from "./ItemList";
import ItemShow from "./ItemShow";

export const itemRoutes: RouteObject[] = [
  {
    path: "/items/new",
    element: <ItemCreate />,
  },
  {
    path: "/items/:id/edit",
    element: <ItemEdit />,
  },
  {
    path: "/items",
    element: <ItemList />,
  },
  {
    path: "/items/:id",
    element: <ItemShow />,
  },
];
