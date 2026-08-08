declare module "*.css";

type Json = string | number | bigint | boolean | null | JsonObject | JsonArray;

type JsonObject = { [key: string]: Json };
type JsonArray = Json[];

type RowId = number;

type Item = {
  id: RowId;
  title: string;
  user_id: RowId;
};

type User = {
  id: RowId;
  email: string;
  name: string;
  avatar_url: string | null;
};

type MagicLinkToken = {
  user_id: RowId;
  token_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
};
