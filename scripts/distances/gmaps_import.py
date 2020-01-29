#!/bin/python

from datetime import date
import sys
import json
import os
import psycopg2


conn_str = os.environ['POSTGRES_CONNECTION_STR']


def import_gmaps_drivetimes(data):
    origin_cid, origin_city = data['origin_city']
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            for (dest_cid, dest_city), row in zip(data['dest_cities'], data['results']['rows'][0]['elements']):
                (citya_cid, citya_name), (cityb_cid, cityb_name) = sorted([(dest_cid, dest_city), (origin_cid, origin_city)])
                minutes = row['duration']['value'] / 60
                print '%s -> %s - %d minutes' % (citya_name, cityb_name, minutes)
                cur.execute('''
                    INSERT INTO city_travel_time(citya_id, cityb_id, gmap_drive_time_minutes)
                    VALUES(%s, %s, %s)
                    ON CONFLICT (citya_id, cityb_id) DO NOTHING;''',
                    (citya_cid, cityb_cid, minutes))


if __name__ == '__main__':
    ind = sys.argv[1]
    for fn in os.listdir(ind):
        infp = os.path.join(ind, fn)
        with open(infp, 'r+') as f:
            j = json.load(f)
        import_gmaps_drivetimes(j)
