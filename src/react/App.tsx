import { Outlet } from "react-router";

import "./App.css";

import NavBar from "./components/NavBar";

function App() {
  return (
    <main>
      <NavBar />
      <Outlet />
    </main>
  );
}

export default App;
