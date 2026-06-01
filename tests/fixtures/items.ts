/*
  Purpose:
  Centralize all mocked data for both API and React tests.
  This ensures consistency and eliminates duplication.

  Naming:
  Use descriptive names (e.g., teacherUser, mainPlay) to make tests more readable.
*/
import { barUser, fooUser } from "./users";

export const allItems: Item[] = [
  {
    id: 1,
    title: "Stuff",
    user_id: fooUser.id,
  },
  {
    id: 2,
    title: "Doodads",
    user_id: barUser.id,
  },
];
