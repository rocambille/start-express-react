import App from "./App";

import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import ItemEdit from "./pages/ItemEdit";
import ItemIndex from "./pages/ItemIndex";
import ItemNew from "./pages/ItemNew";

export default [
  {
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/items",
        element: <ItemIndex />,
      },
      {
        path: "/items/:id",
        element: <ItemDetail />,
      },
      {
        path: "/items/:id/edit",
        element: <ItemEdit />,
      },
      {
        path: "/items/new",
        element: <ItemNew />,
      },
    ],
  },
];
