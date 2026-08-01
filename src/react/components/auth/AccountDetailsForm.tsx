/*
  Purpose:
  Minimal form component responsible for updating user details.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useAuth hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useId, useState } from "react";
import z from "zod";
import type { $ZodIssue as ZodIssue } from "zod/v4/core";
import { FormError, hasError } from "../FormError";
import { useAuth } from "./AuthContext";

const schema = z.object({
  email: z.email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
});

function AccountDetailsForm() {
  const { me, updateMe } = useAuth();
  const emailId = useId();
  const nameId = useId();
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  return (
    <form
      aria-label="Formulaire de modification de mes informations"
      action={(formData: FormData) => {
        const email = formData.get("email")?.toString();
        const name = formData.get("name")?.toString();

        const parsed = schema.safeParse({ email, name });
        if (!parsed.success) {
          setErrors(parsed.error.issues);
          return;
        }

        setErrors([]);
        updateMe(parsed.data);
      }}
    >
      <fieldset>
        <label htmlFor={emailId}>Email</label>
        <input
          type="email"
          id={emailId}
          name="email"
          required
          defaultValue={me?.email}
          aria-invalid={hasError(errors, "email") || undefined}
          aria-describedby={`${emailId}-error`}
        />
        <FormError issues={errors} name="email" id={`${emailId}-error`} />
      </fieldset>
      <fieldset>
        <label htmlFor={nameId}>Name</label>
        <input
          type="text"
          id={nameId}
          name="name"
          required
          defaultValue={me?.name}
          aria-invalid={hasError(errors, "name") || undefined}
          aria-describedby={`${nameId}-error`}
        />
        <FormError issues={errors} name="name" id={`${nameId}-error`} />
      </fieldset>

      <button type="submit">Save</button>
    </form>
  );
}

export default AccountDetailsForm;
