#!/bin/python

from datetime import date
import sys
import json
import os


def process_darksky_forecast(data):
    raw = data['daily']['data']
    forecasts = []
    for it in raw:
        forecasts.append({
            'date': date.fromtimestamp(it['time']).isoformat(),
            'mintemp': it['temperatureLow'],
            'maxtemp': it['temperatureHigh'],
            'minfeel': it['apparentTemperatureLow'],
            'maxfeel': it['apparentTemperatureHigh'],
            'cloudcover': it['cloudCover'] * 100,
            'rainpct': it['precipProbability'] * 100,
            })
    return forecasts


if __name__ == '__main__':
    ind = sys.argv[1]
    outd = sys.argv[2]
    for fn in os.listdir(ind):
        infp = os.path.join(ind, fn)
        outfp = os.path.join(outd, fn)
        with open(infp, 'r+') as f:
            j = json.load(f)
        processed = process_darksky_forecast(j['results'])
        with open(outfp, 'w+') as f:
            json.dump({'city': j['city'], 'results': processed}, f)
