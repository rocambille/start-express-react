// src/react/pages/Showcase.tsx
import { useState } from "react";
import ActionStateExample from "../components/showcase/ActionStateExample";
import FormStatusExample from "../components/showcase/FormStatusExample";

type ShowcaseType = "actionState" | "formStatus";

export default function ShowcasePage() {
  const [activeShowcase, setActiveShowcase] =
    useState<ShowcaseType>("actionState");

  return (
    <article style={{ maxWidth: "800px", margin: "2rem auto" }}>
      <header>
        <h1>React Hooks Showcase</h1>
        <p>
          A single showcase page with a menu to choose which component to
          display.
        </p>
      </header>

      <nav>
        <button
          type="button"
          onClick={() => setActiveShowcase("actionState")}
          aria-disabled={activeShowcase === "actionState"}
        >
          useActionState
        </button>
        <button
          type="button"
          onClick={() => setActiveShowcase("formStatus")}
          aria-disabled={activeShowcase === "formStatus"}
        >
          useFormStatus
        </button>
      </nav>

      <hr />

      {activeShowcase === "actionState" && <ActionStateExample />}
      {activeShowcase === "formStatus" && <FormStatusExample />}
    </article>
  );
}
