import os
import smtplib
import ssl
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2
import requests

conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)

base_url = os.environ['BASE_URL']

email_host = os.environ['EMAIL_HOST']
email_user = os.environ['EMAIL_USER']
email_pw = os.environ['EMAIL_PW']
email_from = os.environ['EMAIL_FROM']

server = smtplib.SMTP_SSL(email_host, 465)


COLS = [
  'user_alert.id user_alert_id',
  'users.email user_email',
  'users.id user_id',
  'users.user_uuid user_uuid',
  'user_alert.city_id city_id',
  'city.name city_name',
  'user_alert.max_drive_minutes max_drive_minutes',
  'user_alert.weath_type weath_type',
  'start_date_forecasted',
  'end_date_forecasted',
  'cities_gained_csl',
  'cities_lost_csl',
  'did_change',
]
IDXS = dict((c.split(' ')[-1], i) for i, c in enumerate(COLS))

def get(row, col):
  if col not in IDXS:
    raise Exception('%s not in IDXS [%s]' % (col, ','.join(IDXS.iterkeys())))
  idx = IDXS[col]
  if idx >= len(row):
    raise Exception('%s has an invalid index in row, %d >= %d' % (col, idx, len(row)))
  return row[idx]


EMAIL_DISPLAY_NAME = 'VitaminD'

GAINED_CITIES_EMAIL_TMPL_PLAIN = '''\
%(email)s,
You have new opportunities for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here: %(href)s

- VitaminD

Naviagte here to manage alerts: %(manage_href)s
'''

LOST_CITIES_EMAIL_TMPL_PLAIN = '''\
%(email)s,
We detected fewer opportunities than you had yesterday for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here to make sure you don't need to change your plans: %(href)s

- VitaminD

Naviagte here to manage alerts: %(manage_href)s
'''


def build_html_email(today, cities, alert):
  cities_gained = [cities[int(cid)] for cid in filter(None, get(alert, 'cities_gained_csl').split(','))]
  cities_lost = [cities[int(cid)] for cid in filter(None, get(alert, 'cities_lost_csl').split(','))]
  payload = {
    'userAlert': {
      'id': get(alert, 'user_alert_id'),
      'user': { 'id': get(alert, 'user_id'), 'email': get(alert, 'user_email'), 'user_uuid': get(alert, 'user_uuid') },
      'city': { 'id': get(alert, 'city_id'), 'name': get(alert, 'city_name') },
      'max_drive_minutes': get(alert, 'max_drive_minutes'),
      'weath_type': get(alert, 'weath_type'),
      'active': True,
      'start_date_forecasted': get(alert, 'start_date_forecasted').isoformat(),
      'end_date_forecasted': get(alert, 'end_date_forecasted').isoformat(),
      'cities_gained': [{'id': cid, 'name': name} for cid, name in cities_gained],
      'cities_lost': [{'id': cid, 'name': name} for cid, name in cities_lost],
      'did_change': True,
    },
  }
  r = requests.post('http://localhost:3000/api/emails/alertHTML', json=payload)
  r.raise_for_status()
  return r.text.encode('utf-8')


def build_plaintext_email(today, cities, alert):
  if get(alert, 'cities_gained_csl'):
    tmpl = GAINED_CITIES_EMAIL_TMPL_PLAIN
  else:
    tmpl = LOST_CITIES_EMAIL_TMPL_PLAIN

  tmpl_params = {
    'base_url': base_url,
    'user_alert_id': get(alert, 'user_alert_id'),
    'email': get(alert, 'user_email'),
    'user_uuid': get(alert, 'user_uuid'),
    'max_drive_hours': get(alert, 'max_drive_minutes') / 60,
    'weath_type': get(alert, 'weath_type'),
    'city_name': get(alert, 'city_name'),
    'city_id': get(alert, 'city_id'),
    }
  tmpl_params['href'] = '%(base_url)s/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&weath_type=%(weath_type)s&emailAlert=true' % tmpl_params
  tmpl_params['unsub_href'] = '%(base_url)s/user_alert/unsubscribe/%(user_alert_id)s?userUUID=%(user_uuid)s' % tmpl_params
  tmpl_params['manage_href'] = '%(base_url)s/user_alert/manage?userUUID=%(user_uuid)s' % tmpl_params

  return tmpl % tmpl_params


def send_alert(today, cities, alert):
  html = build_html_email(today, cities, alert)
  plain = build_plaintext_email(today, cities, alert)

  message = MIMEMultipart("alternative")
  message["Subject"] = 'VitaminD alert triggered'
  message["From"] = '%s <%s>' % (EMAIL_DISPLAY_NAME, email_from)
  message["To"] = get(alert, 'user_email')
  message.attach(MIMEText(plain, "plain"))
  message.attach(MIMEText(html, "html"))

  server.sendmail(email_from, get(alert, 'user_email'), message.as_string())


def process_alert(today, cities, alert):
  with conn:
    with conn.cursor() as cur:
      try:
        if get(alert, 'did_change'):
          print 'sending alert to: %s' % get(alert, 'user_email')
          send_alert(today, cities, alert)
        else:
          print 'not sending alert email to: %s' % get(alert, 'user_email')
        cur.execute('''
          INSERT INTO user_alert_instance(user_alert_id, date, attempts, completed, sent_alert)
          VALUES(%s, %s, 1, TRUE, %s)
          ON CONFLICT(user_alert_id, date)
          DO UPDATE SET
            attempts = user_alert_instance.attempts + 1,
            completed = TRUE,
            sent_alert = %s
        ''', (get(alert, 'user_alert_id'), today, get(alert, 'did_change'), get(alert, 'did_change')))
      except Exception as e:
        print 'FAILED TO SEND to: %s, %s' % (get(alert, 'user_email'), e)
        cur.execute('''
          INSERT INTO user_alert_instance(user_alert_id, date, attempts, completed, sent_alert)
          VALUES(%s, %s, 1, FALSE, FALSE)
          ON CONFLICT(user_alert_id, date)
          DO UPDATE SET
            attempts = user_alert_instance.attempts + 1,
            completed = FALSE,
            sent_alert = FALSE
        ''', (get(alert, 'user_alert_id'), today))


def get_all_cities():
  with conn:
    with conn.cursor() as cur:
      cur.execute('SELECT id, name FROM city;')
      return dict((cid, (cid, name)) for cid, name in cur.fetchall())


def process_user_alerts():
  today = date.today()
  cities = get_all_cities()
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT {}
        FROM user_alert
        JOIN users ON user_id = users.id
        JOIN city ON user_alert.city_id = city.id
        JOIN alert_status ON (
          user_alert.city_id = alert_status.city_id AND
          user_alert.max_drive_minutes = alert_status.max_drive_minutes AND
          user_alert.weath_type = alert_status.weath_type AND
          end_date_forecasted = %s
        )
        WHERE users.email_confirmed = TRUE AND user_alert.active = TRUE AND user_alert.id NOT IN (
          SELECT user_alert_id
          FROM user_alert_instance
          WHERE
            date = %s AND
            completed = TRUE AND
            attempts < 5
        );
      '''.format(', '.join(COLS)), (today, today))
      for row in cur.fetchall():
        process_alert(today, cities, row)


if __name__ == '__main__':
  try:
    server.login(email_user, email_pw)
    process_user_alerts()
  finally:
    server.close()
    conn.close()
