-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE user_alert (
    id SERIAL PRIMARY KEY,
    city_id integer NOT NULL REFERENCES city(id),
    max_drive_minutes integer NOT NULL,
    user_id integer NOT NULL REFERENCES users(id),
    active boolean NOT NULL DEFAULT true,
    unique_id uuid NOT NULL DEFAULT uuid_generate_v4()
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX user_alert_city_id_user_id_idx ON user_alert(city_id int4_ops,user_id int4_ops);
CREATE INDEX user_alert_city_id_max_drive_minutes_active_idx ON user_alert(city_id int4_ops,max_drive_minutes int4_ops,active bool_ops);
CREATE UNIQUE INDEX user_alert_unique_id_idx ON user_alert(unique_id uuid_ops);
