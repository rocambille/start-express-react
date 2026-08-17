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

import { createValidator } from "../../helpers/validation";
import { ItemDTOSchema } from "./itemSchemas";

const add = createValidator(
  { body: ItemDTOSchema },
  {
    inject: (req) => ({
      user_id: req.me.id, // Trusted from auth middleware
    }),
  },
);

const edit = createValidator(
  { body: ItemDTOSchema },
  {
    inject: (req) => ({
      id: req.item.id, // Trusted from param converter
      user_id: req.me.id, // Trusted from auth middleware
    }),
  },
);

export default {
  add,
  edit,
};
