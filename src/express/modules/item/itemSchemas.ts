/*
  Purpose:
  Centralize Zod schemas for the Item resource (SSOT).
*/

import { z } from "zod";

/*
  Item Master Entity Schema
*/
export const ItemSchema = z.object({
  id: z.number(),
  title: z.string().max(255),
  user_id: z.number(),
});

export type Item = z.infer<typeof ItemSchema>;

/*
  Item DTO Schema (Client Input Boundary)
*/
export const ItemDTOSchema = ItemSchema.omit({
  id: true,
  user_id: true,
});

export type ItemDTO = z.infer<typeof ItemDTOSchema>;

export type ItemDTOWithUserId = ItemDTO & {
  user_id: User["id"];
};
