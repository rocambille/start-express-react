/*
  Purpose:
  Validate and normalize incoming Item payloads for mutative requests.

  This validator:
  - Enforces shape and constraints of Item DTOs
  - Injects trusted server-side data (user_id)
  - Acts as a boundary between untrusted input and business logic

  What this file intentionally does NOT do:
  - No authorization checks (handled elsewhere)
  - No persistence logic
  - No HTTP routing decisions

  Design notes:
  - Validation happens as early as possible in the request pipeline
  - Zod is used for explicit, composable schemas
  - Parsed data replaces req.body to guarantee type safety downstream

  Related docs:
  - https://zod.dev/
*/

import { z } from "zod";

/*
  Item Data Transfer Object (DTO)

  Notes:
  - `user_id` is NOT trusted from the client:
    it will always be overridden with the authenticated user id
*/
const itemDTOSchema = z.object({
  title: z.string().max(255),
});

/*
  Export validator
*/
import { createValidator } from "../../helpers/validation";

export default createValidator(itemDTOSchema, {
  inject: (req) => ({
    user_id: req.me.id, // Trusted server-side injection
  }),
});
