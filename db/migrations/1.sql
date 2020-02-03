ALTER TABLE city ADD COLUMN forecast BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE city ADD COLUMN selectable BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE city SET forecast = TRUE;
UPDATE city SET selectable = TRUE WHERE name IN ('Seattle', 'Spokane', 'Portland');
