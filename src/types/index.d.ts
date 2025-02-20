type Credentials = {
  email: string;
  password: string;
};

type Item = {
  id: number;
  title: string;
  user_id: number;
};

type User = {
  id: number;
  email: string;
};

type UserWithPassword = User & {
  password: string;
};
