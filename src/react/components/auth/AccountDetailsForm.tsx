/*
  Purpose:
  Minimal form component responsible for updating user details.

  Design notes:
  - Use a native <form> to keep semantics explicit
  - Delegates all side effects to the useMe hook

  Related docs:
  - https://react.dev/reference/react-dom/components/form
*/

import { useId, useState } from "react";
import { z } from "zod";
import type { $ZodIssue as ZodIssue } from "zod/v4/core";
import { FormError, hasError } from "../FormError";
import { useMe } from "./MeContext";

type AccountDetailsFormValues = Pick<User, "email" | "name">;

const AccountDetailsFormSchema: z.ZodType<AccountDetailsFormValues> = z.object({
  email: z.email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
});

function AccountDetailsForm() {
  const { user, updateMe } = useMe();
  const emailId = useId();
  const nameId = useId();
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  return (
    <form
      aria-label="account details form"
      action={(formData: FormData) => {
        const parsed = AccountDetailsFormSchema.safeParse(
          Object.fromEntries(formData),
        );

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
          defaultValue={user?.email}
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
          defaultValue={user?.name}
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
