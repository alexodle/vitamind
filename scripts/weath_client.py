#!/bin/python

import requests
from collections import defaultdict
from datetime import date
import sys
import os
import json


appid = os.environ['OPENWEATHER_APPID']
base_url = 'https://api.openweathermap.org/data/2.5'


def get_weath(city):
    r = requests.get('%s/forecast' % base_url, params={
        'q': '%s,us' % city,
        'units': 'imperial',
        'appid': appid,
    })
    res = r.json()
    return res


def wget(city, outd):
    result = get_weath(city)
    fp = os.path.join(outd, city.replace(' ', '_') + '.json')
    with open(fp, 'w+') as f:
        json.dump({'city': city, 'results': result}, f)


if __name__ == '__main__':
    outd = sys.argv[1]
    wget('Seattle', outd)
    wget('San Francisco', outd)
    wget('Los Angeles', outd)
    wget('San Diego', outd)
    wget('Palm Springs', outd)
    wget('Phoenix', outd)
