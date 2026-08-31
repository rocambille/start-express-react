declare module "*.css";

type Json = string | number | bigint | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: Json };
type JsonArray = Json[];

type Item = import("../express/modules/item/itemSchemas").Item;
type User = import("../express/modules/user/userSchemas").User;
