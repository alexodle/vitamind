ALTER TABLE processed_forecast ADD COLUMN max_consecutive_wknd INTEGER;
UPDATE processed_forecast SET max_consecutive_wknd = 0;
ALTER TABLE processed_forecast ALTER COLUMN max_consecutive_wknd SET NOT NULL;

ALTER TABLE processed_forecast ADD COLUMN is_recommended_wknd BOOLEAN;
UPDATE processed_forecast SET is_recommended_wknd = FALSE;
ALTER TABLE processed_forecast ALTER COLUMN is_recommended_wknd SET NOT NULL;

ALTER TABLE processed_forecast ADD COLUMN max_consecutive_warm_wknd INTEGER;
UPDATE processed_forecast SET max_consecutive_warm_wknd = 0;
ALTER TABLE processed_forecast ALTER COLUMN max_consecutive_warm_wknd SET NOT NULL;

ALTER TABLE processed_forecast ADD COLUMN is_recommended_warm_wknd BOOLEAN;
UPDATE processed_forecast SET is_recommended_warm_wknd = FALSE;
ALTER TABLE processed_forecast ALTER COLUMN is_recommended_warm_wknd SET NOT NULL;


ALTER TABLE user_alert ADD COLUMN wknds_only BOOLEAN;
UPDATE user_alert SET wknds_only = FALSE;
ALTER TABLE user_alert ALTER COLUMN wknds_only SET NOT NULL;


ALTER TABLE alert_status ADD COLUMN wknds_only BOOLEAN;
UPDATE alert_status SET wknds_only = FALSE;
ALTER TABLE alert_status ALTER COLUMN wknds_only SET NOT NULL;

DROP INDEX alert_status_unique_props_idx;
CREATE UNIQUE INDEX alert_status_unique_props_idx ON alert_status(city_id,end_date_forecasted,max_drive_minutes,weath_type,wknds_only);
