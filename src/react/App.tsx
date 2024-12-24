import { Outlet } from "react-router";

import "./App.css";

import NavBar from "./components/NavBar";
import { Suspense } from "react";

function App() {
  return (
    <main>
      <NavBar />
      <Suspense fallback={<p>loading...</p>}>
        <Outlet />
      </Suspense>
    </main>
  );
}

export default App;
