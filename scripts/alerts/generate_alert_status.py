import psycopg2
import sys
import os
from collections import defaultdict
import db_constants


# IMPORTANT: Keep in sync with constants.ts
VALID_DRIVE_HOURS = set([4, 6, 8, 12, 20])
WEATH_TYPES = ('sunny', 'warm')


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)


def get_is_recommended_prop(weath_type, wknds_only):
  if weath_type == 'sunny':
    return 'is_recommended' if not wknds_only else 'is_recommended_wknd'
  else:
    return 'is_recommended_warm' if not wknds_only else 'is_recommended_warm_wknd'


# returns (cities_gained, cities_lost)
def cities_gained_lost_for_city(city_id, start_date_forecasted, end_date_forecasted, drive_time_mins, weath_type, wknds_only):
  is_recommended_prop = get_is_recommended_prop(weath_type, wknds_only)
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT date_forecasted, city.id city_id
        FROM processed_forecast pf
        JOIN city ON city.id = pf.city_id
        JOIN city_travel_time_all ctt ON ctt.city_from_id = %s AND ctt.city_to_id = pf.city_id
        WHERE
          {} = TRUE AND
          (date_forecasted = %s OR date_forecasted = %s) AND
          ctt.gmap_drive_time_minutes <= %s;
      '''.format(is_recommended_prop), (city_id, start_date_forecasted, end_date_forecasted, drive_time_mins))
      by_fd = defaultdict(set)
      for df, city_id in cur.fetchall():
        by_fd[df].add(city_id)
      cities_before, cities_after = by_fd[start_date_forecasted], by_fd[end_date_forecasted]
      return (cities_after - cities_before, cities_before - cities_after)


def build_cid_csl(cids):
  return ','.join(sorted(str(cid) for cid in cids))


def foreach_alert_type():
  for city_name, city_cid in db_constants.HARDCODED_DARK_CITIES:
    for drive_time_hours in VALID_DRIVE_HOURS:
      for weath_type in WEATH_TYPES:
        for wknds_only in [True, False]:
          yield city_name, city_cid, drive_time_hours, weath_type, wknds_only


def generate_alert_status():
  with conn:
    with conn.cursor() as cur:
      cur.execute('SELECT DISTINCT(date_forecasted) FROM processed_forecast ORDER BY date_forecasted DESC LIMIT 2;')
      (most_recent_df, ), (second_most_recent_df, ) = cur.fetchall()

  for city_name, city_cid, drive_time_hours, weath_type, wknds_only in foreach_alert_type():
    drive_time_mins = drive_time_hours * 60

    print 'analyzing alert status for city: %s, drive_time: %s, weath_type: %s, wknds_only: %r' % (city_name, drive_time_mins, weath_type, wknds_only)
    gained, lost = cities_gained_lost_for_city(city_cid, second_most_recent_df, most_recent_df, drive_time_mins, weath_type, wknds_only)

    with conn:
      with conn.cursor() as cur:
        cur.execute('''
          INSERT INTO alert_status(
            city_id,
            start_date_forecasted,
            end_date_forecasted,
            max_drive_minutes,
            weath_type,
            wknds_only,
            cities_gained_csl,
            cities_lost_csl,
            did_change
          )
          VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)
          ON CONFLICT (city_id, end_date_forecasted, max_drive_minutes, weath_type, wknds_only) DO NOTHING;
        ''', (
          city_cid,
          second_most_recent_df,
          most_recent_df,
          drive_time_mins,
          weath_type,
          wknds_only,
          build_cid_csl(gained),
          build_cid_csl(lost),
          bool(len(gained) or len(lost)))
          )


if __name__ == '__main__':
  try:
    generate_alert_status()
  finally:
    conn.close()
