-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE user_alert_instance
(
    user_alert_id integer NOT NULL REFERENCES user_alert(id),
    date date NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    completed boolean NOT NULL DEFAULT false,
    sent_alert boolean NOT NULL DEFAULT false
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX user_alert_instances_user_alert_id_date_idx ON user_alert_instance(user_alert_id
int4_ops,date date_ops);
CREATE INDEX user_alert_instance_date_completed_user_alert_id_idx ON user_alert_instance(date
date_ops,completed bool_ops,user_alert_id int4_ops);
