ALTER TABLE users ADD COLUMN email_conf_uuid UUID DEFAULT uuid_generate_v4();
ALTER TABLE users ADD COLUMN email_conf_uuid_last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN email_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX users_email_conf_uuid_idx ON users(email_conf_uuid uuid_ops);
CREATE INDEX users_email_conf_uuid_email_conf_uuid_last_updated_idx ON users(email_conf_uuid uuid_ops,email_conf_uuid_last_updated timestamptz_ops);
