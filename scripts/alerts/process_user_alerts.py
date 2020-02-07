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

EMAIL_DISPLAY_NAME = 'VitaminD'

GAINED_CITIES_EMAIL_SUBJ = 'VitaminD alert - new VitaminD opportunities detected!'
GAINED_CITIES_EMAIL_TMPL = '''\
<html>
<body>
<b>%(email)s</b>,
<p>You have new opportunities for VitaminD within a <b>%(max_drive_hours)s hour</b> drive of <b>%(city_name)s</b>.</p>
<p><a href="%(base_url)s/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&emailAlert=true"><b>Check them out here</b></a></p>
<br/>
- VitaminD
<br/>
<br/>
<a href="%(base_url)s/user_alert/unsubscribe/%(unique_id)s">Unusbscribe</a>
</body>
</html>'''
GAINED_CITIES_EMAIL_TMPL_PLAIN = '''\
%(email)s,
You have new opportunities for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here: %(base_url)s/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&emailAlert=true

- VitaminD

Navigate here to unsubscribe: %(base_url)s/user_alert/unsubscribe/%(unique_id)s
'''

LOST_CITIES_EMAIL_SUBJ = 'VitaminD alert - you lost some VitaminD opportunities'
LOST_CITIES_EMAIL_TMPL = '''\
<html>
<body>
<b>%(email)s</b>,
<p>We detected fewer opportunities than you had yesterday for VitaminD within a <b>%(max_drive_hours)s hour</b> drive of <b>%(city_name)s</b>.</p>
<p><a href="%(base_url)s/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&emailAlert=true">\
<b>Check them out here to make sure you don't need to change your plans</b>\
</a></p>
<br/>
- VitaminD
<br/>
<br/>
<a href="%(base_url)s/user_alert/unsubscribe/%(unique_id)s">Unusbscribe</a>
</body>
</html>'''
LOST_CITIES_EMAIL_TMPL_PLAIN = '''\
%(email)s,
We detected fewer opportunities than you had yesterday for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here to make sure you don't need to change your plans: %(base_url)s/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&emailAlert=true

- VitaminD

Navigate here to unsubscribe: %(base_url)s/user_alert/unsubscribe/%(unique_id)s
'''


def send_alert(today, alert_row):
  _, email, alert_unique_id, city_id, city_name, max_drive_minutes, cities_gained_csl, _, _ = alert_row

  if cities_gained_csl:
    subj = GAINED_CITIES_EMAIL_SUBJ
    html_tmpl = GAINED_CITIES_EMAIL_TMPL
    plain_tmpl = GAINED_CITIES_EMAIL_TMPL_PLAIN
  else:
    subj = LOST_CITIES_EMAIL_SUBJ
    html_tmpl = LOST_CITIES_EMAIL_TMPL
    plain_tmpl = LOST_CITIES_EMAIL_TMPL_PLAIN

  tmpl_params = { 'base_url': os.environ['BASE_URL'], 'email': email, 'unique_id': alert_unique_id, 'max_drive_hours': max_drive_minutes / 60, 'city_name': city_name, 'city_id': city_id}
  body = html_tmpl % tmpl_params
  body_plain = plain_tmpl % tmpl_params

  message = MIMEMultipart("alternative")
  message["Subject"] = subj
  message["From"] = '%s <%s>' % (EMAIL_DISPLAY_NAME, email_from)
  message["To"] = email
  message.attach(MIMEText(body_plain, "plain"))
  message.attach(MIMEText(body, "html"))

  server.sendmail(email_from, email, message.as_string())


def process_alert(today, alert_row):
  user_alert_id, email, _, _, _, _, _, _, did_change = alert_row
  with conn:
    with conn.cursor() as cur:
      if did_change:
        print 'sending alert to: %s' % email
        send_alert(today, alert_row)
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
  #today = date.today()
  today = date(2020, 2, 2)
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT user_alert.id user_alert_id, email, user_alert.unique_id unique_id, user_alert.city_id city_id, city.name city_name, user_alert.max_drive_minutes max_drive_minutes, cities_gained_csl, cities_lost_csl, did_change
        FROM user_alert
        JOIN users ON user_id = users.id
        JOIN city ON user_alert.city_id = city.id
        JOIN alert_status ON (
          user_alert.city_id = alert_status.city_id AND
          user_alert.max_drive_minutes = alert_status.max_drive_minutes AND
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
      ''', (today, today))
      for row in cur.fetchall():
        process_alert(today, row)


if __name__ == '__main__':
  try:
    server.login(email_user, email_pw)
    process_user_alerts()
  finally:
    server.close()
    conn.close()
