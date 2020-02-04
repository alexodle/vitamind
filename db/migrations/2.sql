ALTER TABLE user_alert ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;
DROP INDEX user_alert_city_id_max_drive_minutes_idx;
CREATE INDEX user_alert_city_id_max_drive_minutes_active_idx ON user_alert(city_id int4_ops,max_drive_minutes int4_ops,active bool_ops);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE user_alert ADD COLUMN unique_id UUID NOT NULL DEFAULT uuid_generate_v4();
CREATE UNIQUE INDEX user_alert_unique_id_idx ON user_alert(unique_id uuid_ops);
