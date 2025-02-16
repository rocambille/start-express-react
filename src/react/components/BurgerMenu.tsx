import { useId } from "react";

import { useAuth } from "../contexts/AuthContext";

import LoginRegisterForm from "./LoginRegisterForm";

function BurgerMenu() {
  const { user, logout } = useAuth();

  const burgerMenuId = useId();

  return (
    <>
      <button type="button" popoverTarget={burgerMenuId} className="contrast">
        Menu
      </button>
      <div id={burgerMenuId} popover="auto">
        <button
          type="button"
          popoverTarget={burgerMenuId}
          popoverTargetAction="hide"
          className="contrast"
        >
          Fermer
        </button>
        {user ? (
          <button type="button" onClick={logout}>
            Me déconnecter
          </button>
        ) : (
          <LoginRegisterForm />
        )}
      </div>
    </>
  );
}

export default BurgerMenu;
