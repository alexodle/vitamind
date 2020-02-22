#!/bin/python

import psycopg2
from datetime import date
import os


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)


FC_COLS = [
  'city_id',
  'fc_date',
  'mintemp',
  'maxtemp',
  'minfeel',
  'maxfeel',
  'cloudcover',
  'rainpct',
  'date_forecasted',
  'is_warm',
  'is_sunny',
]
IDXS = dict((c, i) for i, c in enumerate(FC_COLS))

WEEKEND_DAYS = (5, 6)


# IMPORTANT: definition of sunny should match the image we display on the frontend (should probably move that logic here)
def is_sunny_day(rainpct, cloudcover):
  return rainpct < 20.0 and cloudcover <= 75.0


def is_warm_day(rainpct, cloudcover, maxtemp, maxfeel):
  return rainpct < 20.0 and cloudcover < 100.0 and maxtemp >= 67.0 and maxfeel <= 90.0


def max_consecutive(lst, cmp):
  curr_max = 0
  curr = 0
  for it in lst:
    if cmp(it):
      curr += 1
      curr_max = max(curr_max, curr)
    else:
      curr = 0
  return curr_max


def max_consecutive_sunny_days(fcs):
  return max_consecutive(fcs, cmp=lambda fc: fc[IDXS['is_sunny']])


def max_consecutive_warm_days(fcs):
  return max_consecutive(fcs, cmp=lambda fc: fc[IDXS['is_warm']])


def evaluate_fcs(fcs):
  # limit to 6 days (accurracy)
  fcs = fcs[:6]
  max_consecutive = max_consecutive_sunny_days(fcs)
  max_consecutive_warm = max_consecutive_warm_days(fcs)

  wknd_fcs = [fc for fc in fcs if fc[IDXS['fc_date']].weekday() in WEEKEND_DAYS]
  max_consecutive_wknd = max_consecutive_sunny_days(wknd_fcs)
  max_consecutive_warm_wknd = max_consecutive_warm_days(wknd_fcs)

  is_recommended = max_consecutive > 1
  is_recommended_warm = max_consecutive_warm > 1
  is_recommended_wknd = max_consecutive_wknd > 0
  is_recommended_warm_wknd = max_consecutive_warm_wknd > 0

  return (
    len(fcs),
    max_consecutive, is_recommended,
    max_consecutive_warm, is_recommended_warm,
    max_consecutive_wknd, is_recommended_wknd,
    max_consecutive_warm_wknd, is_recommended_warm_wknd
  )


def process_forecast(city_id, city_name, today_iso):
  print 'processing city: %s' % city_name
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT {}
        FROM forecast
        WHERE city_id = %s AND date_forecasted = %s
        '''.format(', '.join(FC_COLS)), (city_id, today_iso))
      fcs = cur.fetchall()
      (
        ndays,
        max_consecutive, is_recommended,
        max_consecutive_warm, is_recommended_warm,
        max_consecutive_wknd, is_recommended_wknd,
        max_consecutive_warm_wknd, is_recommended_warm_wknd,
      ) = evaluate_fcs(fcs)
      cur.execute('''
        INSERT INTO processed_forecast(
          city_id,
          date_forecasted,
          ndays,
          max_consecutive_good_days, is_recommended,
          max_consecutive_warm_days, is_recommended_warm,
          max_consecutive_wknd, is_recommended_wknd,
          max_consecutive_warm_wknd, is_recommended_warm_wknd
          )
        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (city_id, date_forecasted) DO NOTHING;
        ''', (
          city_id,
          today_iso,
          ndays,
          max_consecutive, is_recommended,
          max_consecutive_warm, is_recommended_warm,
          max_consecutive_wknd, is_recommended_wknd,
          max_consecutive_warm_wknd, is_recommended_warm_wknd,
          ))


def process_weekly_forecasts():
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


def process_warm_sunny():
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT id, maxtemp, maxfeel, cloudcover, rainpct
        FROM forecast
        WHERE is_warm IS NULL OR is_sunny IS NULL;''')
      for fid, maxtemp, maxfeel, cloudcover, rainpct in cur.fetchall():
        is_sunny = is_sunny_day(rainpct, cloudcover)
        is_warm = is_warm_day(rainpct, cloudcover, maxtemp, maxfeel)
        cur.execute('''
          UPDATE forecast
          SET is_warm = %s, is_sunny = %s
          WHERE id = %s;
          ''', (is_warm, is_sunny or is_warm, fid))


if __name__ == '__main__':
  try:
    process_warm_sunny()
    process_weekly_forecasts()
  finally:
    conn.close()
