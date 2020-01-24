import os
import psycopg2
import csv
import sys


conn_str = os.environ['POSTGRES_CONNECTION_STR']


def export_all_cities(of):
  w = csv.writer(of)
  w.writerow(['id', 'name'])
  with psycopg2.connect(conn_str) as conn:
      with conn.cursor() as cur:
        cur.execute('SELECT id, name FROM city ORDER BY name;')
        for row in cur.fetchall():
          w.writerow(row)


if __name__ == '__main__':
  outfp = sys.argv[1]
  with open(outfp, 'w+') as of:
    export_all_cities(of)
