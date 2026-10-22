/*
  Purpose:
  Centralize Zod schemas for the User resource (SSOT).
*/

import { z } from "zod";
import { serverEnv } from "../../../env/server";

/*
  Emails are compared and stored trimmed and lowercase:
  "Foo@Mail.com " is the account of "foo@mail.com".
*/
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(255));

/*
  User Master Entity Schema
*/
export const UserSchema = z.object({
  id: z.number(),
  email: EmailSchema,
  name: z.string().max(255),
  avatar_url: z
    .string()
    .nullable()
    .refine((maybeRelativeUrl) => {
      if (!maybeRelativeUrl) {
        return true;
      }

      try {
        new URL(maybeRelativeUrl, serverEnv.APP_BASE_URL);
        return true;
      } catch {
        return false;
      }
    }),
});

export type User = z.infer<typeof UserSchema>;

/*
  User DTO Schema (Client Input Boundary)
*/
export const UserDTOSchema = UserSchema.omit({
  id: true,
  avatar_url: true,
});

export type UserDTO = z.infer<typeof UserDTOSchema>;
