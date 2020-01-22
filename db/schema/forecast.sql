-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE forecast (
    id SERIAL PRIMARY KEY,
    city_id integer NOT NULL REFERENCES city(id),
    fc_date date NOT NULL,
    mintemp integer NOT NULL,
    maxtemp integer NOT NULL,
    minfeel integer NOT NULL,
    maxfeel integer NOT NULL,
    cloudcover integer NOT NULL,
    rainpct integer NOT NULL,
    date_forecasted date NOT NULL
);

-- Indices -------------------------------------------------------

CREATE UNIQUE INDEX forecast_pkey ON forecast(id int4_ops);
CREATE INDEX forecast_city_id_date_forecasted_idx ON forecast(city_id int4_ops,date_forecasted date_ops);
CREATE UNIQUE INDEX forecast_city_id_date_forecasted_fc_date_idx ON forecast(city_id int4_ops,date_forecasted date_ops,fc_date date_ops);
