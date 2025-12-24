/*
  Purpose:
  Declare and export all routes related to the "item" domain.

  This file acts as:
  - A routing entry point for the item features
  - A single place to understand the URL structure of item-related pages

  Design notes:
  - Feature-based routing (each domain owns its routes)
  - Flat, explicit paths for clarity and predictability
  - Easy inclusion via route spreading (...itemRoutes)

  Usage:
  - Imported and spread into the main router configuration
  - Keeps react/routes.tsx small and readable
*/

import type { RouteObject } from "react-router";

import ItemCreate from "./ItemCreate";
import ItemEdit from "./ItemEdit";
import ItemList from "./ItemList";
import ItemShow from "./ItemShow";

/* ************************************************************************ */
/* Routes                                                                   */
/* ************************************************************************ */

/*
  Route ordering matters:
  - More specific paths (new, edit) come before generic ones (:id)
*/

export const itemRoutes: RouteObject[] = [
  {
    // Create a new item
    path: "/items/new",
    element: <ItemCreate />,
  },
  {
    // Edit an existing item
    path: "/items/:id/edit",
    element: <ItemEdit />,
  },
  {
    // List all items
    path: "/items",
    element: <ItemList />,
  },
  {
    // Show a single item
    path: "/items/:id",
    element: <ItemShow />,
  },
];
