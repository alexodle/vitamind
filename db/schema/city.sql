-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    loc geometry(Point,4326) NOT NULL,
    forecast boolean NOT NULL DEFAULT false,
    selectable boolean NOT NULL DEFAULT false
);
