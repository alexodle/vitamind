ALTER TABLE processed_forecast ADD COLUMN max_consecutive_warm_days INTEGER;
UPDATE processed_forecast SET max_consecutive_warm_days = 0;
ALTER TABLE processed_forecast ALTER COLUMN max_consecutive_warm_days SET NOT NULL;

ALTER TABLE processed_forecast ADD COLUMN warm_days_csl TEXT;
UPDATE processed_forecast SET warm_days_csl = '';
ALTER TABLE processed_forecast ALTER COLUMN warm_days_csl SET NOT NULL;

ALTER TABLE processed_forecast ADD COLUMN is_recommended_warm BOOLEAN;
UPDATE processed_forecast SET is_recommended_warm = FALSE;
ALTER TABLE processed_forecast ALTER COLUMN is_recommended_warm SET NOT NULL;
