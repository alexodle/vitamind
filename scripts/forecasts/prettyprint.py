import os
import json
import sys


degree_sign = u'\N{DEGREE SIGN}'


def friendly_cloudiness(clouds):
    if clouds < 25.0:
        return 'Sunny'
    if clouds < 75.0:
        return 'Partly Sunny'
    return 'Cloudy'


def friendly_raininess(rain_pct):
    if rain_pct < 5.0:
        return None
    if rain_pct < 25.0:
        return 'Some rain'
    if rain_pct < 50.0:
        return 'Showers'
    return 'Rain'


def friendly_degress(n):
    return '%d%s' % (int(n), degree_sign)


def prettyprint(j):
    city = j['city']
    forecasts = j['results']
    print city
    for date, fc in forecasts:
        raininess = friendly_raininess(fc['rain_pct'])
        print '%s - %s%s, High Temp: %s (Feels Like: %s)' % (
            date,
            '(%s) ' % raininess if raininess else '',
            friendly_cloudiness(fc['cloudcover']), 
            friendly_degress(fc['max']), 
            friendly_degress(fc['maxfeel']))


if __name__ == '__main__':
    ind = sys.argv[1]
    for fn in os.listdir(ind):
        with open(os.path.join(ind, fn), 'r+') as f:
            j = json.load(f)
        prettyprint(j)
        print ''
