insert into user(id, email, password)
values
  (1, "jdoe@mail.com", "$argon2id$v=19$m=19456,t=2,p=1$M6cNKyAnMbdydp1xs6voqA$BNdO1lV91bQBqzOpvkROZJKbSHqEW5PzFAp5C/bgvwY");

insert into item(id, title, user_id)
values
  (1, "Stuff", 1),
  (2, "Doodads", 1);
