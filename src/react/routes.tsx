import { Suspense } from "react";
import { Outlet } from "react-router";

import BurgerMenu from "./components/BurgerMenu";
import NavBar from "./components/NavBar";

import { AuthProvider } from "./contexts/AuthContext";
import { ItemProvider } from "./contexts/ItemContext";

import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import ItemEdit from "./pages/ItemEdit";
import ItemIndex from "./pages/ItemIndex";
import ItemNew from "./pages/ItemNew";

import "./index.css";

export default [
  {
    path: "/",
    element: (
      <AuthProvider>
        <main>
          <NavBar />
          <BurgerMenu />
          <Outlet />
        </main>
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/items",
        element: (
          <Suspense fallback={<p>loading...</p>}>
            <ItemProvider>
              <Outlet />
            </ItemProvider>
          </Suspense>
        ),
        children: [
          {
            index: true,
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
    ],
  },
];
