CREATE TABLE user_conf (
    conf_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    conf_timestampz TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id integer NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX user_conf_conf_id_idx ON user_conf(conf_id);
