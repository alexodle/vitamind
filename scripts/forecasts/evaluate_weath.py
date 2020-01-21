#!/bin/python

import sys
import json
import os


def is_good_day(df):
  return df['rainpct'] < 20.0 and df['cloudcover'] < 100.0 and df['maxtemp'] >= 67.0 and df['maxfeel'] <= 82.0


def evaluate_days(dfs):
  for df in dfs:
    df['isGoodDay'] = is_good_day(df)


def max_consecutive_good_days(dfs):
  curr_max = 0
  curr = 0
  for df in dfs:
    if df['isGoodDay']:
      curr +=1
      curr_max = max(curr_max, curr)
    else:
      curr = 0
  return curr_max


def evaluate_fc(fc):
  #limit to 6 days (accurracy)
  fc['results'] = fc['results'][:6]
  evaluate_days(fc['results'])
  goodness = max_consecutive_good_days(fc['results'])
  fc['maxConsecutiveGoodDays'] = goodness
  fc['recommended'] = goodness > 1
  return fc


if __name__ == '__main__':
    ind = sys.argv[1]
    outd = sys.argv[2]
    for fn in os.listdir(ind):
        infp = os.path.join(ind, fn)
        outfp = os.path.join(outd, fn)
        with open(infp, 'r+') as f:
            j = json.load(f)
        evaluated = evaluate_fc(j)
        with open(outfp, 'w+') as f:
            json.dump(evaluated, f)
