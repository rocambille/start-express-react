drop database if exists starter;
create database starter;
use starter;

create table user (
  id int unsigned primary key auto_increment not null,
  email varchar(255) not null unique,
  password varchar(255) not null,
  created_at datetime default current_timestamp,
  updated_at datetime default current_timestamp on update current_timestamp,
  deleted_at datetime default null
);

create table item (
  id int unsigned primary key auto_increment not null,
  title varchar(255) not null,
  created_at datetime default current_timestamp,
  updated_at datetime default current_timestamp on update current_timestamp,
  deleted_at datetime default null,
  user_id int unsigned not null,
  foreign key(user_id) references user(id) on delete cascade
);

insert into user(id, email, password)
values
  (1, "jdoe@mail.com", "123456");

insert into item(id, title, user_id)
values
  (1, "Stuff", 1),
  (2, "Doodads", 1);
