ALTER TABLE users ADD COLUMN user_uuid uuid NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE users ALTER COLUMN email SET NOT NULL;
