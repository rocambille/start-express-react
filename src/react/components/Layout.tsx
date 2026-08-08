/*
  Purpose:
  Define the global layout of the application.

  This component is responsible for:
  - Providing application-wide contexts (authentication)
  - Rendering persistent UI elements (navigation, menus)
  - Hosting routed page content via `children`

  Design notes:
  - Layout is intentionally "thin": it composes components
    but does not own business logic.
  - Authentication context is provided at this level so all
    routed pages can access it.
  - UI elements such as NavBar are always present,
    regardless of the active route.
*/

import { Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import MagicLinkForm from "./auth/MagicLinkForm";
import { useMe } from "./auth/MeContext";
import NavBar from "./NavBar";

function Layout() {
  const { isAuthenticated } = useMe();
  const location = useLocation();

  return (
    /*
      Authentication context:
      Wraps the entire layout so any descendant component
      can access authentication state and actions.
    */
    <>
      {/* **************************************************************** */}
      {/* Persistent header                                                */}
      {/* **************************************************************** */}

      <header>
        <NavBar />
      </header>

      {/* **************************************************************** */}
      {/* Routed content                                                   */}
      {/* **************************************************************** */}

      <main>
        {isAuthenticated || location.pathname === "/verify" ? (
          /*
            Suspense boundary:
            - Catches React suspensions from use(getOrFetch(...)) in child components
            - Shows a plain loading message while data is being fetched
            - The header stays visible during loading
          */
          <Suspense fallback={<p>Loading…</p>}>
            <Outlet />
          </Suspense>
        ) : (
          <MagicLinkForm />
        )}
      </main>
    </>
  );
}

export default Layout;
