-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE users
(
  id integer DEFAULT nextval('user_id_seq'
  ::regclass) PRIMARY KEY,
    email text
);

  -- Indices -------------------------------------------------------

  CREATE UNIQUE INDEX user_pkey ON users(id
  int4_ops);
  CREATE UNIQUE INDEX user_email_idx ON users(email
  text_ops);
