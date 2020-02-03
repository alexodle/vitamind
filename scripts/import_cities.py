import os
import psycopg2
import csv
import sys


conn_str = os.environ['POSTGRES_CONNECTION_STR']


def insert_all_cities(cities):
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            for city, lat, lon in cities:
                cur.execute('''
                    INSERT INTO city(name, loc)
                    VALUES(%s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                    ON CONFLICT (name) DO NOTHING;''',
                    (city, lon, lat))


def read_cities(fp):
    cities = []
    with open(fp, 'r+') as f:
        rdr = csv.reader(f)
        next(rdr) # skip header
        for row in rdr:
            cities.append((row[0], float(row[1]), float(row[2])))
    return cities


if __name__ == '__main__':
    cities = read_cities(sys.argv[1])
    insert_all_cities(cities)
