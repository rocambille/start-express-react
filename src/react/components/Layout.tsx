import type { PropsWithChildren } from "react";

import { AuthProvider } from "./AuthContext";
import AuthForm from "./AuthForm";
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
