ALTER TABLE forecast ADD COLUMN is_warm BOOLEAN;
ALTER TABLE forecast ADD COLUMN is_sunny BOOLEAN;

ALTER TABLE processed_forecast ALTER COLUMN good_days_csl DROP NOT NULL;
ALTER TABLE processed_forecast ALTER COLUMN warm_days_csl DROP NOT NULL;
