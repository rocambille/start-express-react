// src/react/components/showcase/FormStatusExample.tsx
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

async function submitForm(previousState: string | null, formData: FormData) {
  const name = formData.get('name') as string;
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return `Merci, ${name} ! Votre message a été reçu.`;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-disabled={pending}>
      {pending ? 'Envoi en cours...' : 'Envoyer'}
    </button>
  );
}

export default function FormStatusExample() {
  const [state, formAction] = useActionState(submitForm, null);

  return (
    <article>
      <h4>Demonstration</h4>
      <form action={formAction}>
        <label htmlFor="name">Votre nom</label>
        <input type="text" id="name" name="name" required />
        <SubmitButton />
      </form>
      {state && <p><strong>Statut :</strong> {state}</p>}
    </article>
  );
}