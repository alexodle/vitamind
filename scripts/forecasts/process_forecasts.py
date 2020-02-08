#!/bin/python

import psycopg2
from datetime import date
import os


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)


CITY_ID = 0
FC_DATE = 1
MINTEMP = 2
MAXTEMP = 3
MINFEEL = 4
MAXFEEL = 5
CLOUDCOVER = 6
RAINPCT = 7
DATE_FORECASTED = 8


# IMPORTANT: definition of sunny should match the image we display on the frontend (should probably move that logic here)
def is_sunny_day(fc):
  return fc[RAINPCT] < 20.0 and fc[CLOUDCOVER] <= 75.0


def is_warm_day(fc):
  return fc[RAINPCT] < 20.0 and fc[CLOUDCOVER] < 100.0 and fc[MAXTEMP] >= 67.0 and fc[MAXFEEL] <= 82.0


def max_consecutive(lst, cmp, val):
  curr_max = 0
  curr = 0
  values = []
  for it in lst:
    if cmp(it):
      values.append(val(it))
      curr += 1
      curr_max = max(curr_max, curr)
    else:
      curr = 0
  return curr_max, values


def max_consecutive_good_days(fcs):
  return max_consecutive(fcs,
    cmp=lambda fc: is_sunny_day(fc) or is_warm_day(fc),
    val=lambda fc: fc[FC_DATE])


def max_consecutive_warm_days(fcs):
  return max_consecutive(fcs,
    cmp=is_warm_day,
    val=lambda fc: fc[FC_DATE])


def evaluate_fcs(fcs):
  # limit to 6 days (accurracy)
  fcs = fcs[:6]
  max_consecutive, good_days = max_consecutive_good_days(fcs)
  max_consecutive_warm, warm_days = max_consecutive_warm_days(fcs)
  is_recommended = max_consecutive > 1
  is_recommended_warm = max_consecutive_warm > 1
  return len(fcs), max_consecutive, good_days, is_recommended, max_consecutive_warm, warm_days, is_recommended_warm


def process_forecast(city_id, city_name, today_iso):
  print 'processing city: %s' % city_name
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT city_id, fc_date, mintemp, maxtemp, minfeel, maxfeel, cloudcover, rainpct, date_forecasted
        FROM forecast
        WHERE city_id = %s AND date_forecasted = %s
        ''', (city_id, today_iso))
      fcs = cur.fetchall()
      ndays, max_consecutive, good_days, is_recommended, max_consecutive_warm, warm_days, is_recommended_warm = evaluate_fcs(fcs)
      good_days_csl = ','.join(sorted(d.isoformat() for d in good_days))
      warm_days_csl = ','.join(sorted(d.isoformat() for d in warm_days))
      cur.execute('''
        INSERT INTO processed_forecast(city_id, date_forecasted, ndays, max_consecutive_good_days, good_days_csl, is_recommended, max_consecutive_warm_days, warm_days_csl, is_recommended_warm)
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (city_id, date_forecasted) DO NOTHING;
        ''', (city_id, today_iso, ndays, max_consecutive, good_days_csl, is_recommended, max_consecutive_warm, warm_days_csl, is_recommended_warm))


def process_forecasts():
  today_iso = date.today().isoformat()

  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT DISTINCT(city_id), city.name
        FROM forecast
        JOIN city ON city.id = city_id
        WHERE date_forecasted = %s AND city_id NOT IN (
          SELECT city_id FROM processed_forecast WHERE date_forecasted = %s
        );
        ''', (today_iso, today_iso))
      rows = cur.fetchall()
  for city_id, city_name in rows:
    process_forecast(city_id, city_name, today_iso)


if __name__ == '__main__':
  try:
    process_forecasts()
  finally:
    conn.close()
