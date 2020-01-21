#!/bin/python

import requests
from collections import defaultdict
from datetime import date
import sys
import os
import json
import csv
from itertools import groupby


key = os.environ['GMAPS_KEY']
base_url = 'https://maps.googleapis.com/maps/api/distancematrix/json'


def meters_to_miles(meters):
    return round(meters * 0.00062137)


def build_locs_param_value(cities):
    return '|'.join('%s,%s' % (lat, lon) for _, lat, lon in cities)


def request_distances(origins, destinations):
    payload = {
        'key': key,
        'units': 'imperial',
        'origins': build_locs_param_value(origins),
        'destinations': build_locs_param_value(destinations),
        }
    r = requests.get(base_url, params=payload)
    return r.json()


def for_each_city_pair(cities):
    seen = set()
    for citya, lata, lona in cities:
        for cityb, latb, lonb in cities:
            combo = frozenset([citya, cityb])
            if citya == cityb or combo in seen:
                continue
            seen.add(combo)
            yield (citya, lata, lona), (cityb, latb, lonb)


def for_each_distance_matrix_query(cities):
    for origin, pairs in groupby(for_each_city_pair(cities), lambda p: p[0]):
        destinations = [dest for _, dest in pairs]
        yield origin, destinations


def wget_all(cities, outd):
    for origin, destinations in for_each_distance_matrix_query(cities):
        fname = '%s.json' % origin[0].replace(' ', '_')
        ofp = os.path.join(outd, fname)
        print 'QUERY: origin: %s, nDestinations: %s, fp: %s' % (origin[0], len(destinations), ofp)
        results = request_distances([origin], destinations)
        with open(ofp, 'w+') as f:
            json.dump({
                'origin_city': origin[0],
                'dest_cities': [city for city, _, _ in destinations],
                'results': results,
            }, f)


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
    wget_all(cities, outd)
