#!/bin/python

import requests
from datetime import date
import sys
import os
import json
import csv


key = os.environ['DARKSKY_KEY']
base_url = 'https://api.darksky.net'


def get_weath(lat, lon):
    url = '%s/forecast/%s/%s,%s' % (base_url, key, lat, lon)
    r = requests.get(url)
    res = r.json()
    return res


def wget(city, lat, lon, outd):
    today = date.today()
    result = get_weath(lat, lon)
    fp = os.path.join(outd, city.replace(' ', '_') + '.json')
    with open(fp, 'w+') as f:
        json.dump({'city': city, 'date': today.isoformat(), 'results': result}, f)


def read_cities(fp):
    cities = []
    with open(fp, 'r+') as f:
        rdr = csv.reader(f)
        next(rdr) # skip header
        for row in rdr:
            cities.append((row[0], float(row[1]), float(row[2])))
    return cities


if __name__ == '__main__':
    outd = sys.argv[1]
    cities = read_cities('../../latlon.csv')
    for city, lat, lon in cities:
        wget(city, lat, lon, outd)
