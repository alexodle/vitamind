ALTER TABLE user_alert ADD COLUMN weath_type TEXT;
UPDATE user_alert SET weath_type = 'sunny';
ALTER TABLE user_alert ALTER COLUMN weath_type SET NOT NULL;

DROP INDEX user_alert_city_id_max_drive_minutes_active_idx;

ALTER TABLE alert_status ADD COLUMN weath_type TEXT;
UPDATE alert_status SET weath_type = 'sunny';
ALTER TABLE alert_status ALTER COLUMN weath_type SET NOT NULL;

DROP INDEX alert_status_city_id_start_date_forecasted_end_date_forecasted_;
CREATE UNIQUE INDEX alert_status_unique_props_idx ON alert_status(city_id, end_date_forecasted, max_drive_minutes, weath_type);
