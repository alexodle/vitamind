import psycopg2
import os
from datetime import date
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


conn_str = os.environ['POSTGRES_CONNECTION_STR']
conn = psycopg2.connect(conn_str)

email_from = os.environ['ALERT_EMAIL']
email_pw = os.environ['ALERT_EMAIL_PW']
server = smtplib.SMTP_SSL("smtp.gmail.com", 465)


EMAIL_SUBJ_TMPL = 'VitaminD alert - new VitaminD opportunities detected!'
EMAIL_TMPL = '''\
<html>
<body>
<b>%(email)s</b>,
<p>You have new opportunities for VitaminD within a <b>%(max_drive_hours)s hour</b> drive of <b>%(city_name)s</b>.</p>
<p><a href="http://localhost:3000/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&emailAlert=true"><b>Check them out here</b></a></p>
<br/>
<br/>
- VitaminD
</body>
</html>'''
EMAIL_TMPL_PLAIN = '''\
%(email)s,
You have new opportunities for VitaminD within a %(max_drive_hours)s hour drive of %(city_name)s.
Check them out here: http://localhost:3000/forecast?cityID=%(city_id)s&driveHours=%(max_drive_hours)s&emailAlert=true

- VitaminD'''


def send_alert(today, alert_row):
  _, email, city_id, city_name, max_drive_minutes, _, _, _ = alert_row

  tmpl_params = { 'email': email, 'max_drive_hours': max_drive_minutes / 60, 'city_name': city_name, 'city_id': city_id}
  subj = EMAIL_SUBJ_TMPL
  body = EMAIL_TMPL % tmpl_params
  body_plain = EMAIL_TMPL_PLAIN % tmpl_params

  message = MIMEMultipart("alternative")
  message["Subject"] = subj
  message["From"] = email_from
  message["To"] = email

  part1 = MIMEText(body_plain, "plain")
  part2 = MIMEText(body, "html")

  # Add HTML/plain-text parts to MIMEMultipart message
  # The email client will try to render the last part first
  message.attach(part1)
  message.attach(part2)

  # Create secure connection with server and send email
  try:
    server.sendmail(email_from, email, message.as_string())
  finally:
    server.close()


def process_alert(today, alert_row):
  user_alert_id, email, _, _, _, _, _, did_change = alert_row
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
  today = date.today()
  with conn:
    with conn.cursor() as cur:
      cur.execute('''
        SELECT user_alert.id user_alert_id, email, user_alert.city_id city_id, city.name city_name, user_alert.max_drive_minutes max_drive_minutes, cities_gained_csl, cities_lost_csl, did_change
        FROM user_alert
        JOIN users ON user_id = users.id
        JOIN city ON user_alert.city_id = city.id
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
    server.login(email_from, email_pw)
    process_user_alerts()
  finally:
    server.close()
    conn.close()
