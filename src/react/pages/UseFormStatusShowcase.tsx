import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

// This is the action function that simulates a server request.
async function submitForm(previousState: string | null, formData: FormData) {
  const name = formData.get('name') as string;

  // Simulate a 2-second network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return a success message
  return `Merci, ${name} ! Votre message a été reçu.`;
}

// A separate component for the submit button.
// `useFormStatus` must be used in a component that is a child of the <form>.
function SubmitButton() {
  // The `useFormStatus` hook gives us the status of the parent form.
  const { pending } = useFormStatus();

  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? 'Envoi en cours...' : 'Envoyer'}
    </button>
  );
}

// This is the main page component.
export default function UseFormStatusShowcase() {
  const [state, formAction] = useActionState(submitForm, null);

  return (
    <article style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <header>
        <h2>Showcase du Hook `useFormStatus`</h2>
        <p>Ce formulaire utilise `useFormStatus` pour désactiver le bouton d'envoi pendant la soumission.</p>
      </header>

      <form action={formAction}>
        <label htmlFor="name">
          Votre nom
          <input type="text" id="name" name="name" required />
        </label>
        
        {/* The SubmitButton component is used here */}
        <SubmitButton />
      </form>

      {/* Display the success message from the state */}
      {state && <p><strong>Statut :</strong> {state}</p>}
    </article>
  );
}