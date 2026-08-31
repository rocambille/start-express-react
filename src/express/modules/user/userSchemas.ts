/*
  Purpose:
  Centralize Zod schemas for the User resource (SSOT).
*/

import { z } from "zod";
import { serverEnv } from "../../../env/server";

/*
  User Master Entity Schema
*/
export const UserSchema = z.object({
  id: z.number(),
  email: z.email().max(255),
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
