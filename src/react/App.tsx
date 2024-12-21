import { NavLink, Outlet } from "react-router";

import "./App.css";

function App() {
  return (
    <main>
      <nav>
        <ul>
          <li>
            <NavLink to="/">Home</NavLink>
          </li>
          <li>
            <NavLink to="/items">Items</NavLink>
          </li>
        </ul>
      </nav>
      <Outlet />
    </main>
  );
}

export default App;
