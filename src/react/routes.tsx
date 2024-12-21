import App from "./App";

import Home from "./pages/Home";
import ItemIndex from "./pages/ItemIndex";

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
    ],
  },
];
