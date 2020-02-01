--
-- PostgreSQL database dump
--

-- Dumped from database version 12.1
-- Dumped by pg_dump version 12.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry, geography, and raster spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alert_status; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.alert_status (
    city_id integer NOT NULL,
    start_date_forecasted date NOT NULL,
    end_date_forecasted date NOT NULL,
    cities_gained_csl text NOT NULL,
    cities_lost_csl text NOT NULL,
    did_change boolean NOT NULL,
    max_drive_minutes integer NOT NULL
);


ALTER TABLE public.alert_status OWNER TO aodle;

--
-- Name: city; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.city (
    id integer NOT NULL,
    name text NOT NULL,
    loc public.geometry(Point,4326) NOT NULL
);


ALTER TABLE public.city OWNER TO aodle;

--
-- Name: city_id_seq; Type: SEQUENCE; Schema: public; Owner: aodle
--

CREATE SEQUENCE public.city_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.city_id_seq OWNER TO aodle;

--
-- Name: city_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aodle
--

ALTER SEQUENCE public.city_id_seq OWNED BY public.city.id;


--
-- Name: city_travel_time; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.city_travel_time (
    citya_id integer NOT NULL,
    cityb_id integer NOT NULL,
    gmap_drive_time_minutes integer
);


ALTER TABLE public.city_travel_time OWNER TO aodle;

--
-- Name: city_travel_time_all; Type: MATERIALIZED VIEW; Schema: public; Owner: aodle
--

CREATE MATERIALIZED VIEW public.city_travel_time_all AS
 SELECT city_travel_time.citya_id AS city_from_id,
    city_travel_time.cityb_id AS city_to_id,
    city_travel_time.gmap_drive_time_minutes
   FROM public.city_travel_time
UNION
 SELECT city_travel_time.cityb_id AS city_from_id,
    city_travel_time.citya_id AS city_to_id,
    city_travel_time.gmap_drive_time_minutes
   FROM public.city_travel_time
  WITH NO DATA;


ALTER TABLE public.city_travel_time_all OWNER TO aodle;

--
-- Name: forecast; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.forecast (
    id integer NOT NULL,
    city_id integer NOT NULL,
    fc_date date NOT NULL,
    mintemp integer NOT NULL,
    maxtemp integer NOT NULL,
    minfeel integer NOT NULL,
    maxfeel integer NOT NULL,
    cloudcover integer NOT NULL,
    rainpct integer NOT NULL,
    date_forecasted date NOT NULL
);


ALTER TABLE public.forecast OWNER TO aodle;

--
-- Name: forecast_id_seq; Type: SEQUENCE; Schema: public; Owner: aodle
--

CREATE SEQUENCE public.forecast_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.forecast_id_seq OWNER TO aodle;

--
-- Name: forecast_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aodle
--

ALTER SEQUENCE public.forecast_id_seq OWNED BY public.forecast.id;


--
-- Name: processed_forecast; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.processed_forecast (
    id integer NOT NULL,
    city_id integer NOT NULL,
    date_forecasted date NOT NULL,
    max_consecutive_good_days integer NOT NULL,
    is_recommended boolean NOT NULL,
    good_days_csl text NOT NULL,
    ndays integer NOT NULL
);


ALTER TABLE public.processed_forecast OWNER TO aodle;

--
-- Name: processed_forecast_id_seq; Type: SEQUENCE; Schema: public; Owner: aodle
--

CREATE SEQUENCE public.processed_forecast_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.processed_forecast_id_seq OWNER TO aodle;

--
-- Name: processed_forecast_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aodle
--

ALTER SEQUENCE public.processed_forecast_id_seq OWNED BY public.processed_forecast.id;


--
-- Name: user_alert; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.user_alert (
    id integer NOT NULL,
    city_id integer NOT NULL,
    max_drive_minutes integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.user_alert OWNER TO aodle;

--
-- Name: user_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: aodle
--

CREATE SEQUENCE public.user_alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_alert_id_seq OWNER TO aodle;

--
-- Name: user_alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aodle
--

ALTER SEQUENCE public.user_alert_id_seq OWNED BY public.user_alert.id;


--
-- Name: user_alert_instance; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.user_alert_instance (
    user_alert_id integer NOT NULL,
    date date NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    sent_alert boolean DEFAULT false NOT NULL
);


ALTER TABLE public.user_alert_instance OWNER TO aodle;

--
-- Name: users; Type: TABLE; Schema: public; Owner: aodle
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text
);


ALTER TABLE public.users OWNER TO aodle;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: aodle
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO aodle;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: aodle
--

ALTER SEQUENCE public.user_id_seq OWNED BY public.users.id;


--
-- Name: city id; Type: DEFAULT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.city ALTER COLUMN id SET DEFAULT nextval('public.city_id_seq'::regclass);


--
-- Name: forecast id; Type: DEFAULT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.forecast ALTER COLUMN id SET DEFAULT nextval('public.forecast_id_seq'::regclass);


--
-- Name: processed_forecast id; Type: DEFAULT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.processed_forecast ALTER COLUMN id SET DEFAULT nextval('public.processed_forecast_id_seq'::regclass);


--
-- Name: user_alert id; Type: DEFAULT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.user_alert ALTER COLUMN id SET DEFAULT nextval('public.user_alert_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: city city_name_key; Type: CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_name_key UNIQUE (name);


--
-- Name: city city_pkey; Type: CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_pkey PRIMARY KEY (id);


--
-- Name: forecast forecast_pkey; Type: CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.forecast
    ADD CONSTRAINT forecast_pkey PRIMARY KEY (id);


--
-- Name: processed_forecast processed_forecast_pkey; Type: CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.processed_forecast
    ADD CONSTRAINT processed_forecast_pkey PRIMARY KEY (id);


--
-- Name: user_alert user_alert_pkey; Type: CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.user_alert
    ADD CONSTRAINT user_alert_pkey PRIMARY KEY (id);


--
-- Name: users user_pkey; Type: CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: alert_status_city_id_start_date_forecasted_end_date_forecasted_; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX alert_status_city_id_start_date_forecasted_end_date_forecasted_ ON public.alert_status USING btree (city_id, start_date_forecasted, end_date_forecasted, max_drive_minutes);


--
-- Name: alert_status_start_date_forecasted_end_date_forecasted_did_chan; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX alert_status_start_date_forecasted_end_date_forecasted_did_chan ON public.alert_status USING btree (start_date_forecasted, end_date_forecasted, did_change);


--
-- Name: city_travel_time_all_city_from_id_city_to_id_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX city_travel_time_all_city_from_id_city_to_id_idx ON public.city_travel_time_all USING btree (city_from_id, city_to_id);


--
-- Name: city_travel_time_city_lookup; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX city_travel_time_city_lookup ON public.city_travel_time USING btree (citya_id, cityb_id);


--
-- Name: city_travel_time_citya_drivetime; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX city_travel_time_citya_drivetime ON public.city_travel_time USING btree (citya_id, gmap_drive_time_minutes);


--
-- Name: city_travel_time_cityb_drivetime; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX city_travel_time_cityb_drivetime ON public.city_travel_time USING btree (cityb_id, gmap_drive_time_minutes);


--
-- Name: forecast_city_id_date_forecasted_fc_date_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX forecast_city_id_date_forecasted_fc_date_idx ON public.forecast USING btree (city_id, date_forecasted, fc_date);


--
-- Name: forecast_city_id_date_forecasted_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX forecast_city_id_date_forecasted_idx ON public.forecast USING btree (city_id, date_forecasted);


--
-- Name: processed_forecast_city_id_date_forecasted_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX processed_forecast_city_id_date_forecasted_idx ON public.processed_forecast USING btree (city_id, date_forecasted);


--
-- Name: processed_forecast_date_forecasted_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX processed_forecast_date_forecasted_idx ON public.processed_forecast USING btree (date_forecasted);


--
-- Name: user_alert_city_id_max_drive_minutes_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX user_alert_city_id_max_drive_minutes_idx ON public.user_alert USING btree (city_id, max_drive_minutes);


--
-- Name: user_alert_city_id_user_id_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX user_alert_city_id_user_id_idx ON public.user_alert USING btree (city_id, user_id);


--
-- Name: user_alert_instance_date_completed_user_alert_id_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE INDEX user_alert_instance_date_completed_user_alert_id_idx ON public.user_alert_instance USING btree (date, completed, user_alert_id);


--
-- Name: user_alert_instances_user_alert_id_date_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX user_alert_instances_user_alert_id_date_idx ON public.user_alert_instance USING btree (user_alert_id, date);


--
-- Name: user_email_idx; Type: INDEX; Schema: public; Owner: aodle
--

CREATE UNIQUE INDEX user_email_idx ON public.users USING btree (email);


--
-- Name: alert_status alert_status_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.alert_status
    ADD CONSTRAINT alert_status_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.city(id);


--
-- Name: city_travel_time city_travel_times_citya_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.city_travel_time
    ADD CONSTRAINT city_travel_times_citya_fkey FOREIGN KEY (citya_id) REFERENCES public.city(id);


--
-- Name: city_travel_time city_travel_times_cityb_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.city_travel_time
    ADD CONSTRAINT city_travel_times_cityb_fkey FOREIGN KEY (cityb_id) REFERENCES public.city(id);


--
-- Name: forecast forecast_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.forecast
    ADD CONSTRAINT forecast_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.city(id);


--
-- Name: processed_forecast processed_forecast_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.processed_forecast
    ADD CONSTRAINT processed_forecast_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.city(id);


--
-- Name: user_alert user_alert_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.user_alert
    ADD CONSTRAINT user_alert_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.city(id);


--
-- Name: user_alert_instance user_alert_instances_user_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.user_alert_instance
    ADD CONSTRAINT user_alert_instances_user_alert_id_fkey FOREIGN KEY (user_alert_id) REFERENCES public.user_alert(id);


--
-- Name: user_alert user_alert_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aodle
--

ALTER TABLE ONLY public.user_alert
    ADD CONSTRAINT user_alert_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

