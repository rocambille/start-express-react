create table user (
  id integer primary key not null,
  email varchar(255) not null unique,
  name varchar(255) not null,
  avatar_url text default null,
  created_at datetime default (strftime('%Y-%m-%dT%H:%M:%SZ')),
  deleted_at datetime default null
);

create table magic_link_token (
  user_id integer primary key not null,
  token_hash char(64) not null,
  expires_at datetime not null,
  consumed_at datetime default null,
  foreign key(user_id) references user(id) on delete cascade
);

create table item (
  id integer primary key not null,
  title varchar(255) not null,
  created_at datetime default (strftime('%Y-%m-%dT%H:%M:%SZ')),
  deleted_at datetime default null,
  user_id integer not null,
  foreign key(user_id) references user(id) on delete cascade
);
