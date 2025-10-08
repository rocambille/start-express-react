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
        {link("/showcase", "ShowCase")}
        {link("/items", "Items")}
        {link("/showcase", "Showcase")}
      </ul>
    </nav>
  );
}

export default NavBar;
