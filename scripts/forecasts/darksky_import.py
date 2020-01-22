#!/bin/python

from datetime import date
import sys
import json
import os
import psycopg2


conn_str = os.environ['POSTGRES_CONNECTION_STR']


def import_darksky_forecast(data):
    city = data['city']
    date_forecasted_iso = data['date']
    raw = data['results']['daily']['data']
    today = date.today()
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id FROM city WHERE name = %s;', (city, ))
            city_id = cur.fetchone()
            for it in raw:
                fc_date = date.fromtimestamp(it['time'])
                if fc_date < today:
                    continue
                cur.execute('''
                    INSERT INTO forecast(city_id, date_forecasted, fc_date, mintemp, maxtemp, minfeel, maxfeel, cloudcover, rainpct)
                    VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (city_id, date_forecasted, fc_date) DO NOTHING;''',
                    (
                        city_id,
                        date_forecasted_iso,
                        fc_date.isoformat(),
                        it['temperatureLow'], it['temperatureHigh'],
                        it['apparentTemperatureLow'], it['apparentTemperatureHigh'],
                        it['cloudCover'] * 100,
                        it['precipProbability'] * 100,
                    ))


if __name__ == '__main__':
    ind = sys.argv[1]
    for fn in os.listdir(ind):
        infp = os.path.join(ind, fn)
        with open(infp, 'r+') as f:
            j = json.load(f)
        import_darksky_forecast(j)
