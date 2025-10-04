// src/react/components/showcase/ActionStateExample.tsx
import { useActionState } from 'react';

async function submitItem(previousState: string | null, formData: FormData) {
  const itemName = formData.get('itemName') as string;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (itemName.trim().length < 3) {
    return "Le nom de l'article doit contenir au moins 3 caractères.";
  }
  return `"${itemName}" a été ajouté avec succès !`;
}

export default function ActionStateExample() {
  const [state, formAction, isPending] = useActionState(submitItem, null);

  return (
    <article>
      <h4>Demonstration</h4>
      <form action={formAction}>
        <label htmlFor="itemName">Nom de l'article</label>
        <input type="text" id="itemName" name="itemName" required />
        <button type="submit" aria-disabled={isPending}>
          {isPending ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </form>
      {state && <p><strong>Statut :</strong> {state}</p>}
    </article>
  );
}