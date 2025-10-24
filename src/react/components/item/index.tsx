import ItemCreate from "./ItemCreate";
import ItemEdit from "./ItemEdit";
import ItemList from "./ItemList";
import ItemShow from "./ItemShow";

export const itemRoutes = [
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
];
