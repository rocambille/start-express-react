import { type PropsWithChildren, useId } from "react";

function BurgerMenu({ children }: PropsWithChildren) {
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
        {children}
      </div>
    </>
  );
}

export default BurgerMenu;
