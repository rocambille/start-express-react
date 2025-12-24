/*
  Purpose:
  Provide a lightweight, accessible menu container using
  the native HTML Popover API.

  This component:
  - Wraps arbitrary content (children) inside a popover
  - Uses no JavaScript state for open/close behavior
  - Relies entirely on browser-managed popover semantics

  Design notes:
  - Prefer platform features over custom state machines
  - Keep behavior declarative and predictable
  - Avoid reimplementing modal logic in React

  Related docs:
  - https://react.dev/reference/react/useId
*/

import { type PropsWithChildren, useId } from "react";

function BurgerMenu({ children }: PropsWithChildren) {
  /*
    useId ensures:
    - Stable, unique ids across renders
    - No collision when multiple forms are rendered
  */
  const burgerMenuId = useId();

  return (
    <>
      {/* **************************************************************** */}
      {/* Trigger                                                          */}
      {/* **************************************************************** */}

      <button type="button" popoverTarget={burgerMenuId} className="contrast">
        Menu
      </button>

      {/* **************************************************************** */}
      {/* Popover                                                          */}
      {/* **************************************************************** */}

      <div id={burgerMenuId} popover="auto">
        {/* Close button */}
        <button
          type="button"
          popoverTarget={burgerMenuId}
          popoverTargetAction="hide"
          className="contrast"
        >
          Fermer
        </button>

        {/* Arbitrary content injected by the caller */}
        {children}
      </div>
    </>
  );
}

export default BurgerMenu;
