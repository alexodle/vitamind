CREATE TABLE city_request (
    city text NOT NULL,
    email text NOT NULL,
    date_created timestamptz NOT NULL DEFAULT now()
);
