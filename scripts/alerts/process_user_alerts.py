import psycopg2
import os
from datetime import date
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)

email_host = os.environ['EMAIL_HOST']
email_user = os.environ['EMAIL_USER']
email_pw = os.environ['EMAIL_PW']
email_from = os.environ['EMAIL_FROM']

server = smtplib.SMTP_SSL(email_host, 465)


COLS = [
  'user_alert.id user_alert_id',
  'email',
  'users.user_uuid user_uuid',
  'user_alert.city_id city_id',
  'city.name city_name',
  'user_alert.max_drive_minutes max_drive_minutes',
  'user_alert.weath_type weath_type',
  'cities_gained_csl',
  'cities_lost_csl',
  'did_change',
]
IDXS = dict((c.split(' ')[-1], i) for i, c in enumerate(COLS))

def get(row, col):
  return row[IDXS[col]]


EMAIL_DISPLAY_NAME = 'VitaminD'

GAINED_CITIES_EMAIL_SUBJ = 'New VitaminD opportunities detected!'
GAINED_CITIES_EMAIL_TMPL = '''\
<html>
<body>
<b>%(email)s</b>,
<p>You have new opportunities for <b>%(weath_type)s weather</b> within a <b>%(max_drive_hours)s hour</b> drive of <b>%(city_name)s</b>.</p>
<p><a href="%(href)s"><b>Check them out here</b></a></p>
<br/>
- VitaminD
<br/>
<br/>
<a href="%(manage_href)s">Manage alerts</a> | <a href="%(unsub_href)s">Unusbscribe</a>
</body>
</html>'''
GAINED_CITIES_EMAIL_TMPL_PLAIN = '''\
%(email)s,
You have new opportunities for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here: %(href)s

- VitaminD

Naviagte here to manage alerts: %(manage_href)s
'''

LOST_CITIES_EMAIL_SUBJ = 'You lost some VitaminD opportunities :('
LOST_CITIES_EMAIL_TMPL = '''\
<html>
<body>
<b>%(email)s</b>,
<p>We detected fewer opportunities than you had yesterday for VitaminD within a <b>%(max_drive_hours)s hour</b> drive of <b>%(city_name)s</b>.</p>
<p><a href="%(href)s">\
<b>Check them out here to make sure you don't need to change your plans</b>\
</a></p>
<br/>
- VitaminD
<br/>
<br/>
<a href="%(manage_href)s">Manage alerts</a> | <a href="%(unsub_href)s">Unusbscribe</a>
</body>
</html>'''
LOST_CITIES_EMAIL_TMPL_PLAIN = '''\
%(email)s,
We detected fewer opportunities than you had yesterday for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here to make sure you don't need to change your plans: %(href)s

- VitaminD

Naviagte here to manage alerts: %(manage_href)s
'''


def send_alert(today, alert):
  if get(alert, 'cities_gained_csl'):
    subj = GAINED_CITIES_EMAIL_SUBJ
    html_tmpl = GAINED_CITIES_EMAIL_TMPL
    plain_tmpl = GAINED_CITIES_EMAIL_TMPL_PLAIN
  else:
    subj = LOST_CITIES_EMAIL_SUBJ
    html_tmpl = LOST_CITIES_EMAIL_TMPL
    plain_tmpl = LOST_CITIES_EMAIL_TMPL_PLAIN

  tmpl_params = {
    'base_url': os.environ['BASE_URL'],
    'user_alert_id': get(alert, 'user_alert_id'),
    'email': get(alert, 'email'),
    'user_uuid': get(alert, 'user_uuid'),
    'max_drive_hours': get(alert, 'max_drive_minutes') / 60,
    'weath_type': get(alert, 'weath_type'),
    'city_name': get(alert, 'city_name'),
    'city_id': get(alert, 'city_id'),
    }
  tmpl_params['href'] = '%(base_url)s/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&weath_type=%(weath_type)s&emailAlert=true' % tmpl_params
  tmpl_params['unsub_href'] = '%(base_url)s/user_alert/unsubscribe/%(user_alert_id)s?userUUID=%(user_uuid)s' % tmpl_params
  tmpl_params['manage_href'] = '%(base_url)s/user_alert/manage?userUUID=%(user_uuid)s' % tmpl_params

  body = html_tmpl % tmpl_params
  body_plain = plain_tmpl % tmpl_params

  message = MIMEMultipart("alternative")
  message["Subject"] = subj
  message["From"] = '%s <%s>' % (EMAIL_DISPLAY_NAME, email_from)
  message["To"] = get(alert, 'email')
  message.attach(MIMEText(body_plain, "plain"))
  message.attach(MIMEText(body, "html"))

  server.sendmail(email_from, get(alert, 'email'), message.as_string())


def process_alert(today, alert):
  with conn:
    with conn.cursor() as cur:
      if get(alert, 'did_change'):
        print 'sending alert to: %s' % get(alert, 'email')
        send_alert(today, alert)
      else:
        print 'not sending alert email to: %s' % get(alert, 'email')
      cur.execute('''
        INSERT INTO user_alert_instance(user_alert_id, date, attempts, completed, sent_alert)
        VALUES(%s, %s, 1, TRUE, %s)
        ON CONFLICT(user_alert_id, date)
        DO UPDATE SET
          attempts = user_alert_instance.attempts + 1,
          completed = TRUE,
          sent_alert = %s
      ''', (get(alert, 'user_alert_id'), today, get(alert, 'did_change'), get(alert, 'did_change')))


def process_user_alerts():
  today = date.today()
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
        process_alert(today, row)


if __name__ == '__main__':
  try:
    server.login(email_user, email_pw)
    process_user_alerts()
  finally:
    server.close()
    conn.close()
