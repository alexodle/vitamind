ALTER TABLE users ADD COLUMN email_conf_uuid UUID DEFAULT uuid_generate_v4();
ALTER TABLE users ADD COLUMN email_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
