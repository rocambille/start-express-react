/*
  Purpose:
  Centralize all mocked item data and database seeding for API, contract, and React tests.
  This ensures consistency and eliminates duplication.

  Naming:
  Use descriptive names to make tests more readable.
*/
import type { DatabaseSync } from "node:sqlite";
import { standardUser, userWithAvatar } from "./users";

export const firstItem: Item = Object.freeze({
  id: 1,
  title: "Stuff",
  user_id: standardUser.id,
});

export const secondItem: Item = Object.freeze({
  id: 2,
  title: "Doodads",
  user_id: userWithAvatar.id,
});

export const allItems: Item[] = Object.freeze([
  firstItem,
  secondItem,
]) as Item[];

export const seedItems = (db: DatabaseSync) => {
  const insertItem = db.prepare(
    "insert into item(id, title, user_id) values(?, ?, ?)",
  );
  for (const item of allItems) {
    insertItem.run(item.id, item.title, item.user_id);
  }
};
