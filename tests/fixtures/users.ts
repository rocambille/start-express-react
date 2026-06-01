/*
  Purpose:
  Centralize all mocked data for both API and React tests.
  This ensures consistency and eliminates duplication.

  Naming:
  Use descriptive names (e.g., teacherUser, mainPlay) to make tests more readable.
*/

export const allUsers: User[] = [
  {
    id: 1,
    email: "foo@mail.com",
    name: "foo",
  },
  {
    id: 2,
    email: "bar@mail.com",
    name: "bar",
  },
  {
    id: 3,
    email: "baz@mail.com",
    name: "baz",
  },
  {
    id: 4,
    email: "deleted@mail.com",
    name: "deleted",
  },
];

export const fooUser = allUsers[0];
export const barUser = allUsers[1];
export const bazUser = allUsers[2];
export const deletedUser = allUsers[3];
