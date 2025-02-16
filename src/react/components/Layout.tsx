import type { ReactNode } from "react";

import { AuthProvider } from "./AuthContext";
import AuthForm from "./AuthForm";
import BurgerMenu from "./BurgerMenu";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <header>
        <NavBar />
        <BurgerMenu>
          <AuthForm />
        </BurgerMenu>
      </header>
      <main>{children}</main>
    </AuthProvider>
  );
}

export default Layout;
