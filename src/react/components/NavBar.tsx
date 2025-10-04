import type { ReactNode } from "react";
import { NavLink } from "react-router";

const link = (to: string, children: ReactNode) => (
  <li>
    <NavLink to={to}>{children}</NavLink>
  </li>
);

function NavBar() {
  return (
    <nav>
      <ul>
        {link("/", "Home")}
        {link("/items", "Items")}
        {link("/use-action-state-showcase", "Showcase")}
        {link("/use-form-status-showcase", "useFormStatus")}
      </ul>
    </nav>
  );
}

export default NavBar;
