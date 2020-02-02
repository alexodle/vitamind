#!/bin/python

import requests
from datetime import date
import sys
import os
import json
import csv
import psycopg2


# HACKHACK - TODO FIX
#from ..util import parse_latlon_txt
# ex: POINT(-115.3154248 36.1251954)
def parse_latlon_txt(txt):
    lon, lat = txt[6:-1].split(' ')
    return (lat, lon)


conn_str = os.environ['POSTGRES_CONNECTION_STR']

key = os.environ['DARKSKY_KEY']
base_url = 'https://api.darksky.net'


def get_weath(lat, lon):
    url = '%s/forecast/%s/%s,%s' % (base_url, key, lat, lon)
    r = requests.get(url)
    res = r.json()
    return res


def wget(cid, city_name, lat, lon, today_iso, outd):
    print 'downloading forecast for %s' % city_name
    result = get_weath(lat, lon)
    fp = os.path.join(outd, '%d.json' % cid)
    with open(fp, 'w+') as f:
        json.dump({'city': [cid, city_name], 'date': today_iso, 'results': result}, f)


def read_cities(today):
    cities = []
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT id, name, ST_AsText(loc) city_latlon
                FROM city
                WHERE id NOT IN (
                    SELECT DISTINCT(city_id)
                    FROM forecast
                    WHERE date_forecasted = %s
                )''', (today, ))
            for cid, name, latlon_txt in cur.fetchall():
                lat, lon = parse_latlon_txt(latlon_txt)
                cities.append((cid, name, lat, lon))
    return cities


if __name__ == '__main__':
    outd = sys.argv[1]
    today = date.today()
    cities = read_cities(today)
    for cid, city_name, lat, lon in cities:
        wget(cid, city_name, lat, lon, today.isoformat(), outd)
