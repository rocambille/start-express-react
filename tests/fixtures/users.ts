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
    avatar_url: null,
  },
  {
    id: 2,
    email: "bar@mail.com",
    name: "bar",
    avatar_url: "/uploads/avatars/bar.webp",
  },
  {
    id: 3,
    email: "baz@mail.com",
    name: "baz",
    avatar_url: null,
  },
  {
    id: 4,
    email: "deleted@mail.com",
    name: "deleted",
    avatar_url: null,
  },
  {
    id: 5,
    email: "corrupted@mail.com",
    name: "corrupted",
    avatar_url: "http://[invalid",
  },
];

export const fooUser = allUsers[0];
export const barUser = allUsers[1];
export const bazUser = allUsers[2];
export const deletedUser = allUsers[3];
export const corruptedUser = allUsers[4];
