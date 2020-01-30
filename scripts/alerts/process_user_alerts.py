import psycopg2
import os
from datetime import date


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)


def process_alert(today, alert_row):
  user_alert_id, email, city_id, max_drive_minutes, cities_gained_csl, cities_lost_csl, did_change = alert_row
  with conn:
    with conn.cursor() as cur:
      if did_change:
        print 'sending alert email to: %s -> %s' % (email, (city_id, max_drive_minutes, cities_gained_csl, cities_lost_csl, did_change))
      else:
        print 'not sending alert email to: %s' % email
      cur.execute('''
        INSERT INTO user_alert_instance(user_alert_id, date, attempts, completed, sent_alert)
        VALUES(%s, %s, 1, TRUE, %s)
        ON CONFLICT(user_alert_id, date)
        DO UPDATE SET
          attempts = user_alert_instance.attempts + 1,
          completed = TRUE,
          sent_alert = %s
      ''', (user_alert_id, today, did_change, did_change))


def process_user_alerts():
  today = date.today()
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT user_alert.id user_alert_id, email, user_alert.city_id city_id, user_alert.max_drive_minutes max_drive_minutes, cities_gained_csl, cities_lost_csl, did_change
        FROM user_alert
        JOIN users ON user_id = users.id
        JOIN alert_status ON (
          user_alert.city_id = alert_status.city_id AND
          user_alert.max_drive_minutes = alert_status.max_drive_minutes AND
          end_date_forecasted = %s
        )
        WHERE user_alert.id NOT IN (
          SELECT user_alert_id
          FROM user_alert_instance
          WHERE
            date = %s AND
            completed = TRUE AND
            attempts < 5
        );
      ''', (today, today))
      for row in cur.fetchall():
        process_alert(today, row)


if __name__ == '__main__':
  try:
    process_user_alerts()
  finally:
    conn.close()
