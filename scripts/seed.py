import os
import psycopg2
import csv
import sys


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)


def import_cities(fp):
  with open(fp, 'r+') as f:
    rdr = csv.reader(f)
    next(rdr) # skip header
    for row in rdr:
      with conn:
        with conn.cursor() as cur:
          cur.execute('''
            INSERT INTO city(id,name,loc,forecast,selectable)
            VALUES(%s, %s, %s, %s, %s)
            ON CONFLICT (name) DO NOTHING;''', row)


def import_city_tts(fp):
  with open(fp, 'r+') as f:
    rdr = csv.reader(f)
    next(rdr) # skip header
    for row in rdr:
      with conn:
        with conn.cursor() as cur:
          cur.execute('''
            INSERT INTO city_travel_time(citya_id, cityb_id, gmap_drive_time_minutes)
            VALUES(%s, %s, %s)
            ON CONFLICT (citya_id, cityb_id) DO NOTHING;''', row)
  with conn:
    with conn.cursor() as cur:
      cur.execute('REFRESH MATERIALIZED VIEW city_travel_time_all;')


def import_forecasts(fp):
  with open(fp, 'r+') as f:
    rdr = csv.reader(f)
    next(rdr) # skip header
    for row in rdr:
      with conn:
        with conn.cursor() as cur:
          cur.execute('''
            INSERT INTO forecast(id,city_id,fc_date,mintemp,maxtemp,minfeel,maxfeel,cloudcover,rainpct,date_forecasted)
            VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (city_id,date_forecasted,fc_date) DO NOTHING;''', row)


def import_proc_forecasts(fp):
  with open(fp, 'r+') as f:
    rdr = csv.reader(f)
    next(rdr) # skip header
    for row in rdr:
      with conn:
        with conn.cursor() as cur:
          cur.execute('''
            INSERT INTO processed_forecast(id,city_id,date_forecasted,max_consecutive_good_days,is_recommended,good_days_csl,ndays)
            VALUES(%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (city_id,date_forecasted) DO NOTHING;''', row)



if __name__ == '__main__':
  try:
    import_cities('city.csv')
    import_city_tts('city_travel_time.csv')
    import_forecasts('forecast.csv')
    import_proc_forecasts('processed_forecast.csv')
  finally:
    conn.close()
