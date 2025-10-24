import type { PropsWithChildren } from "react";

import { AuthProvider } from "./auth/AuthContext";
import AuthForm from "./auth/AuthForm";
import BurgerMenu from "./BurgerMenu";
import NavBar from "./NavBar";

function Layout({ children }: PropsWithChildren) {
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
