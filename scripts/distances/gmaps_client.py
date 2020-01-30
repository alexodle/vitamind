#!/bin/python

import requests
from collections import defaultdict
from datetime import date
import sys
import os
import json
import csv
from itertools import groupby
import psycopg2


# HACKHACK - TODO FIX
#from ..util import parse_latlon_txt
# ex: POINT(-115.3154248 36.1251954)
def parse_latlon_txt(txt):
    lon, lat = txt[6:-1].split(' ')
    return (lat, lon)


MAX_DISTANCE_ESTIMATE = 1000 * 1609.34 # 1k miles

ID = 0
NAME = 1
LOC = 2


conn_str = os.environ['POSTGRES_CONNECTION_STR']


key = os.environ['GMAPS_KEY']
base_url = 'https://maps.googleapis.com/maps/api/distancematrix/json'


def meters_to_miles(meters):
    return round(meters * 0.00062137)


def build_locs_param_value(cities):
    return '|'.join('%s,%s' % (lat, lon) for _, _, (lat, lon) in cities)


def request_distances(origins, destinations):
    payload = {
        'key': key,
        'units': 'imperial',
        'origins': build_locs_param_value(origins),
        'destinations': build_locs_param_value(destinations),
        }
    r = requests.get(base_url, params=payload)
    return r.json()


def for_each_distance_matrix_query():
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT
                    citya.id citya_id, citya.name citya_name, ST_AsText(citya.loc) citya_latlon,
                    cityb.id cityb_id, cityb.name cityb_name, ST_AsText(cityb.loc) cityb_latlon
                FROM city citya
                JOIN city cityb ON citya.id < cityb.id
                WHERE
                    (citya.id, cityb.id) NOT IN (
                        SELECT ctt.citya_id, ctt.cityb_id FROM city_travel_time ctt
                        UNION
                        SELECT ctt.cityb_id, ctt.citya_id FROM city_travel_time ctt
                    )
                    AND
                    ST_Distance(ST_Transform(citya.loc, 2163), ST_Transform(cityb.loc, 2163)) <= %s
                ORDER BY citya.id;
            ''', [MAX_DISTANCE_ESTIMATE])
            for _, pairs_it in groupby(cur.fetchall(), lambda p: p[0]):
                rows = list(pairs_it)
                oid, oname, olatlontxt, _, _, _ = rows[0]
                origin = (oid, oname, parse_latlon_txt(olatlontxt))
                dests = [(did, dname, parse_latlon_txt(dlatlon_txt)) for _, _, _, did, dname, dlatlon_txt in rows]
                yield (origin, dests)


def wget_all(outd):
    for origin, destinations in for_each_distance_matrix_query():
        fname = '%s.json' % origin[NAME].replace(' ', '_')
        ofp = os.path.join(outd, fname)
        print 'QUERY: origin: %s, nDestinations: %s, fp: %s' % (origin[NAME], len(destinations), ofp)
        results = request_distances([origin], destinations)
        with open(ofp, 'w+') as f:
            json.dump({
                'origin_city': [origin[ID], origin[NAME]],
                'dest_cities': [[dest_id, dest_name] for dest_id, dest_name, _ in destinations],
                'results': results,
            }, f)


if __name__ == '__main__':
    wget_all(sys.argv[1])
