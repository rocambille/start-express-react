// src/react/components/showcase/ActionStateExample.tsx
import { useActionState, useId } from "react";

async function submitItem(_previousState: string | null, formData: FormData) {
  const itemName = formData.get("itemName") as string;

  // Simulate a 1-second network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (itemName.trim().length < 3) {
    return "Le nom de l'item doit contenir au moins 3 caractères.";
  }

  return `"${itemName}" a été ajouté avec succès !`;
}

export default function ActionStateExample() {
  const [state, formAction, isPending] = useActionState(submitItem, null);

  const itemNameId = useId();

  return (
    <form action={formAction}>
      <hgroup>
        <h2>useActionState</h2>
        <p>
          Use it when you want to track and update a component’s state based on
          the result of a form action or server action (
          <a
            href="https://react.dev/reference/react/useActionState#usage"
            target="_blank"
            rel="noreferrer"
          >
            see usage
          </a>
          )
        </p>
      </hgroup>

      <p>
        <label htmlFor={itemNameId}>Nom de l'item</label>
        <input type="text" id={itemNameId} name="itemName" required />
      </p>

      <button type="submit" aria-disabled={isPending}>
        {isPending ? "Envoi en cours..." : "Envoyer"}
      </button>

      {state && (
        <p>
          <strong>Statut :</strong> {state}
        </p>
      )}
    </form>
  );
}
