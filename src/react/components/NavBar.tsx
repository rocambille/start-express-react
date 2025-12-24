/*
  Purpose:
  Define the main navigation bar of the application.

  This component:
  - Exposes the primary navigation links
  - Relies on React Router for active link handling

  Design notes:
  - No business logic
  - Purely declarative navigation
*/

import type { ReactNode } from "react";
import { NavLink } from "react-router";

/*
  Helper to keep JSX concise and consistent.

  Using NavLink allows React Router to automatically
  apply active styles based on the current route.
*/
const link = (to: string, children: ReactNode) => (
  <li>
    <NavLink to={to}>{children}</NavLink>
  </li>
);

function NavBar() {
  return (
    /*
      Semantic navigation container.

      The <nav> / <ul> structure is intentionally simple
      and accessible by default.
    */
    <nav>
      <ul>
        {link("/", "Home")}
        {link("/items", "Items")}
      </ul>
    </nav>
  );
}

export default NavBar;
