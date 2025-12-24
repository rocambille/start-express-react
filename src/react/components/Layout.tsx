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
  - UI elements such as NavBar and BurgerMenu are always present,
    regardless of the active route.
*/

import type { PropsWithChildren } from "react";

import { AuthProvider } from "./auth/AuthContext";
import AuthForm from "./auth/AuthForm";
import BurgerMenu from "./BurgerMenu";
import NavBar from "./NavBar";

function Layout({ children }: PropsWithChildren) {
  return (
    /*
      Authentication context:
      Wraps the entire layout so any descendant component
      can access authentication state and actions.
    */
    <AuthProvider>
      {/* **************************************************************** */}
      {/* Persistent header                                                */}
      {/* **************************************************************** */}

      <header>
        <NavBar />

        {/*
          The burger menu hosts contextual UI elements.
          Authentication is exposed here to keep login/logout
          accessible without polluting page components.
        */}
        <BurgerMenu>
          <AuthForm />
        </BurgerMenu>
      </header>

      {/* **************************************************************** */}
      {/* Routed content                                                   */}
      {/* **************************************************************** */}

      <main>{children}</main>
    </AuthProvider>
  );
}

export default Layout;
