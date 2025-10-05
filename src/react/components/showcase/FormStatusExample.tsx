// src/react/components/showcase/FormStatusExample.tsx
import { useId } from "react";
import { useFormStatus } from "react-dom";

async function formAction(formData: FormData) {
  const name = formData.get("name") as string;

  // Simulate a 1-second network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  alert(`Merci, ${name} ! Votre message a été reçu.`);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? "Envoi en cours..." : "Envoyer"}
    </button>
  );
}

function FormStatusIndicator() {
  const { data, method, action } = useFormStatus();

  return (
    <>
      {data && (
        <p>
          <strong>Data :</strong>{" "}
          {[...data.entries()].map((entry) => entry.join("=")).join("&")}
        </p>
      )}
      {method && (
        <p>
          <strong>Méthode :</strong> {method}
        </p>
      )}
      {action && (
        <>
          <p>
            <strong>Action :</strong>
          </p>
          <pre>
            <code>{action.toString()}</code>
          </pre>
        </>
      )}
    </>
  );
}

export default function FormStatusExample() {
  const nameId = useId();

  return (
    <form action={formAction}>
      <hgroup>
        <h2>useFormStatus</h2>
        <p>
          Use it when you need to check the current status of a form submission
          inside a form component (
          <a
            href="https://react.dev/reference/react-dom/hooks/useFormStatus#usage"
            target="_blank"
            rel="noreferrer"
          >
            see usage
          </a>
          )
        </p>
      </hgroup>

      <p>
        <label htmlFor={nameId}>Votre nom</label>
        <input type="text" id={nameId} name="name" required />
      </p>

      <SubmitButton />
      <FormStatusIndicator />
    </form>
  );
}
