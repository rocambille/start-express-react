/*
  Purpose:
  Centralize Zod schemas for the User resource (SSOT).
*/

import { z } from "zod";

/*
  User Master Entity Schema
*/
export const UserSchema = z.object({
  id: z.number(),
  email: z.email().max(255),
  name: z.string().max(255),
  avatar_url: z.url().nullable(),
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
