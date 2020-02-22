-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE user_alert (
    id SERIAL PRIMARY KEY,
    city_id integer NOT NULL REFERENCES city(id),
    max_drive_minutes integer NOT NULL,
    user_id integer NOT NULL REFERENCES users(id),
    active boolean NOT NULL DEFAULT true,
    weath_type text NOT NULL,
    wknds_only boolean NOT NULL
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX user_alert_city_id_user_id_idx ON user_alert(city_id int4_ops,user_id int4_ops);
