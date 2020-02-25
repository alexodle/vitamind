#!/bin/python

from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import date
import os

ASSET_URL = os.environ['ASSET_URL'] if 'ASSET_URL' in os.environ else os.environ['BASE_URL']

env = Environment(
    loader=FileSystemLoader('templates/'),
    autoescape=select_autoescape(['html'])
)

# TODO: consolidate (categorize in processing step?)
def get_img(df):
    if df['rainpct'] >= 20:
        return ('rain_s_cloudy.png', 'rain_s_cloudy_30_30.png', 'Rainy')
    elif df['cloudcover'] > 75:
        return ('cloudy.png', 'cloudy_30_30.png', 'Cloudy')
    elif df['cloudcover'] > 25:
        return ('partly_cloudy.png', 'partly_cloudy_30_30.png', 'Partly cloudy')
    return ('sunny.png', 'sunny_30_30.png', 'Sunny')

env.filters['img_alt'] = lambda df: get_img(df)[2]
env.filters['img'] = lambda df: '%s/%s' % (ASSET_URL, get_img(df)[0])
env.filters['img_small'] = lambda df: '%s/%s' % (ASSET_URL, get_img(df)[1])

def friendly_hours(h):
  if h < 1:
    return 'Less than an hour'
  elif h == 1:
    return '1 hour'
  return '%s hours' % h
env.filters['friendly_hours'] = friendly_hours

VOWELS = set('aeiou8')
env.filters['aOrAn'] = lambda nextWord: 'an' if str(nextWord)[0].lower() in VOWELS else 'a'

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
env.filters['weekday'] = lambda d: DAYS[d.weekday()]

DAYS_SHORT = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
env.filters['weekday_short'] = lambda d: DAYS_SHORT[d.weekday()]


tmpl = env.get_template('forecast.html.jinja')
print tmpl.render(
    user_email='alex.odle@gmail.com',
    weath_type='sunny',
    drive_hours=6,
    city_name='Seattle',
    wknds_only=True,
    href='https://hihi.dev.to/helloehlo?abc=hello_me&driveHours=6',
    cities_gained=['hellos'],
    recommendations_cutoff=True,
    recommendations=[
        {
            'city_name': 'Spokane, WA',
            'drive_hours': 4,
            'daily_forecasts': [
                {
                    'date': date.today(),
                    'maxtemp': 54,
                    'rainpct': 19,
                    'cloudcover': 75,
                },
            ]
        },
    ]).encode('utf-8')
