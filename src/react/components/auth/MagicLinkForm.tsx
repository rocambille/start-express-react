/*
  Purpose:
  Magic Link login form - email input only.
*/

import { useId, useState } from "react";
import { z } from "zod";
import type { $ZodIssue as ZodIssue } from "zod/v4/core";
import { FormError, hasError } from "../FormError";
import { useMe } from "./MeContext";

type MagicLinkFormValues = Pick<User, "email">;

const MagicLinkFormSchema: z.ZodType<MagicLinkFormValues> = z.object({
  email: z.email(),
});

function MagicLinkForm() {
  const { sendMagicLink } = useMe();
  const [sent, setSent] = useState(false);
  const emailId = useId();
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  return sent ? (
    <p>
      ✉️ A login link has been sent to your email address.
      <br />
      Check your inbox!
    </p>
  ) : (
    <form
      aria-label="login form"
      action={(formData) => {
        const parsed = MagicLinkFormSchema.safeParse(
          Object.fromEntries(formData),
        );

        if (!parsed.success) {
          setErrors(parsed.error.issues);
          return;
        }

        setErrors([]);
        sendMagicLink(parsed.data.email);
        setSent(true);
      }}
    >
      <hgroup>
        <h1>Login</h1>
        <p>Enter your email to receive a login link.</p>
      </hgroup>

      <input
        id={emailId}
        aria-label="Email"
        type="email"
        name="email"
        defaultValue=""
        placeholder="your.address@mail.com"
        required
        aria-invalid={hasError(errors, "email") || undefined}
        aria-describedby={`${emailId}-error`}
      />
      <FormError issues={errors} name="email" id={`${emailId}-error`} />
      <button type="submit">Receive my login link</button>
    </form>
  );
}

export default MagicLinkForm;
