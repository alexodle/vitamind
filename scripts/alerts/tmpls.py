#!/bin/python

import os
from jinja2 import Environment, FileSystemLoader, select_autoescape


ASSET_URL = os.environ['CDN_URL'] if 'CDN_URL' in os.environ else os.environ['BASE_URL']

env = Environment(
    loader=FileSystemLoader('alerts/templates/'),
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
env.filters['img'] = lambda df: '%s/imgs/%s' % (ASSET_URL, get_img(df)[0])
env.filters['img_small'] = lambda df: '%s/imgs/%s' % (ASSET_URL, get_img(df)[1])


def mins_to_hours(m):
  return int(round(m / 60.0))
env.filters['mins_to_hours'] = mins_to_hours


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


def render_alert_html(params):
    tmpl = env.get_template('forecast.html.jinja')
    return tmpl.render(params).encode('utf-8')
