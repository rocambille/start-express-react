import { useActionState } from 'react';

// This is an async function that simulates submitting data to a server.
// It takes the previous state and the form data as arguments.
async function submitItem(previousState: string | null, formData: FormData) {
  const itemName = formData.get('itemName') as string;

  // Simulate a 1-second network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (itemName.trim().length < 3) {
    return 'Le nom de l\'article doit contenir au moins 3 caractères.';
  }

  // On success, return a success message.
  return `"${itemName}" a été ajouté avec succès !`;
}

// This is our React component.
export default function UseActionStateShowcase() {
  // Here we use the useActionState hook.
  const [state, formAction, isPending] = useActionState(submitItem, null);

  return (
    <article style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <header>
        <h2>Showcase du Hook `useActionState`</h2>
        <p>Ce formulaire montre comment gérer les états "pending", "success" et "error" d'une action de formulaire.</p>
      </header>

      <form action={formAction}>
        <label htmlFor="itemName">
          Nom de l'article
          <input type="text" id="itemName" name="itemName" required />
        </label>

        <button type="submit" aria-disabled={isPending}>
          {isPending ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </form>

      {/* Display the success or error message from the state */}
      {state && <p><strong>Statut :</strong> {state}</p>}
    </article>
  );
}