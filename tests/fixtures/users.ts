/*
  Purpose:
  Centralize all mocked user data and database seeding for API, contract, and React tests.
  This ensures consistency and eliminates duplication.

  Naming:
  Use descriptive names (e.g., standardUser, userWithAvatar) to reveal test intent.
*/
import type { DatabaseSync } from "node:sqlite";

export const standardUser: User = Object.freeze({
  id: 1,
  email: "foo@mail.com",
  name: "foo",
  avatar_url: null,
});

export const userWithAvatar: User = Object.freeze({
  id: 2,
  email: "bar@mail.com",
  name: "bar",
  avatar_url: "/uploads/avatars/bar.webp",
});

export const consumedTokenUser: User = Object.freeze({
  id: 3,
  email: "baz@mail.com",
  name: "baz",
  avatar_url: null,
});

export const deletedUser: User = Object.freeze({
  id: 4,
  email: "deleted@mail.com",
  name: "deleted",
  avatar_url: null,
});

export const corruptedUser: User = Object.freeze({
  id: 5,
  email: "corrupted@mail.com",
  name: "corrupted",
  avatar_url: "http://[invalid",
});

export const allUsers: User[] = Object.freeze([
  standardUser,
  userWithAvatar,
  consumedTokenUser,
  deletedUser,
  corruptedUser,
]) as User[];

export const seedUsers = (db: DatabaseSync) => {
  const insertUser = db.prepare(
    "insert into user(id, email, name, avatar_url) values(?, ?, ?, ?)",
  );
  for (const user of allUsers) {
    insertUser.run(user.id, user.email, user.name, user.avatar_url ?? null);
  }

  const deleteUser = db.prepare(
    "update user set deleted_at = strftime('%Y-%m-%dT%H:%M:%SZ') where id = ?",
  );
  deleteUser.run(deletedUser.id);
};
