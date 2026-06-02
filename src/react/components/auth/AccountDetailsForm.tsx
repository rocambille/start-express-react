/*
  Purpose:
  Minimal form component responsible for updating user details.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useAuth hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import z from "zod";
import { useAuth } from "./AuthContext";

const schema = z.object({
  email: z.email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
});

function AccountDetailsForm() {
  const { me, updateMe } = useAuth();

  return (
    <form
      aria-label="Formulaire de modification de mes informations"
      action={(formData: FormData) => {
        const email = formData.get("email")?.toString();
        const name = formData.get("name")?.toString();

        const parsed = schema.safeParse({ email, name });
        if (!parsed.success) {
          alert(z.prettifyError(parsed.error));
          return;
        }

        updateMe(parsed.data);
      }}
    >
      <fieldset>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          defaultValue={me?.email}
        />
      </fieldset>
      <fieldset>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={me?.name}
        />
      </fieldset>

      <button type="submit">Save</button>
    </form>
  );
}

export default AccountDetailsForm;
