#!/bin/python

import requests
from collections import defaultdict
from datetime import date
import sys
import json
import os


def group_by(l, gbk):
    groups = defaultdict(list)
    for it in l:
        k = gbk(it)
        groups[k].append(it)
    return groups


def mean(l):
    total = 0
    count = 0
    for v in l:
        count += 1
        total += v
    return total * 1.0 / count


def combine_daily(fcs):
    mintemp = min(fc['main']['temp'] for fc in fcs)
    maxtemp = max(fc['main']['temp'] for fc in fcs)
    minfeel = min(fc['main']['feels_like'] for fc in fcs)
    maxfeel = max(fc['main']['feels_like'] for fc in fcs)
    cloudcover = mean(fc['clouds']['all'] for fc in fcs)
    rain_pct = (sum(1 for fc in fcs if 'rain' in fc) * 1.0 / len(fcs)) * 100
    return {
        'min': mintemp,
        'max': maxtemp,
        'minfeel': minfeel,
        'maxfeel': maxfeel,
        'cloudcover': cloudcover,
        'rain_pct': rain_pct,
    }


def parse_daily_forecast(weath):
    by_day = group_by(weath['list'], lambda it: str(date.fromtimestamp(it['dt'])))
    forecasts = sorted([day, combine_daily(vals)] for day, vals in by_day.iteritems())
    return forecasts


if __name__ == '__main__':
    ind = sys.argv[1]
    outd = sys.argv[2]
    for fn in os.listdir(ind):
        infp = os.path.join(ind, fn)
        outfp = os.path.join(outd, fn)
        with open(infp, 'r+') as f:
            j = json.load(f)
        parsed = parse_daily_forecast(j['results'])
        with open(outfp, 'w+') as f:
            json.dump({'city': j['city'], 'results': parsed}, f)
