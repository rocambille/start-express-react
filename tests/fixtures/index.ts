/*
  Purpose:
  Central registry for mock fixtures and test database seeders.
  Orders seeders to respect foreign key constraints.
*/
import type { DatabaseSync } from "node:sqlite";
import { seedAuthTokens } from "./auth";
import { seedItems } from "./items";
import { seedUsers } from "./users";

export type Seeder = (db: DatabaseSync) => void;

// Seeders ordered by foreign key dependencies (users before items/tokens)
export const seeders: readonly Seeder[] = Object.freeze([
  seedUsers,
  seedItems,
  seedAuthTokens,
]);

export * from "./auth";
export * from "./items";
export * from "./users";
