#!/bin/python

from datetime import date
import sys
import json
import os
import psycopg2


conn_str = os.environ['POSTGRES_CONNECTION_STR']


def import_gmaps_drivetimes(data):
    origin_city = data['origin_city']
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT id, name FROM city WHERE name = %s;', (origin_city, ))
            origin_cid, origin_city = cur.fetchone()
            for dest_city, row in zip(data['dest_cities'], data['results']['rows'][0]['elements']):
                cur.execute('SELECT id, name FROM city WHERE name = %s;', (dest_city, ))
                dest_cid, dest_city = cur.fetchone()

                citya, cityb = sorted([(dest_city, dest_cid), (origin_city, origin_cid)])
                minutes = row['duration']['value'] / 60
                print '%s -> %s - %d minutes' % (citya[0], cityb[0], minutes)
                cur.execute('''
                    INSERT INTO city_travel_times(citya, cityb, gmap_drive_time_minutes)
                    VALUES(%s, %s, %s)
                    ON CONFLICT (citya, cityb) DO NOTHING;''',
                    (citya[1], cityb[1], minutes))


if __name__ == '__main__':
    ind = sys.argv[1]
    for fn in os.listdir(ind):
        infp = os.path.join(ind, fn)
        with open(infp, 'r+') as f:
            j = json.load(f)
        import_gmaps_drivetimes(j)
