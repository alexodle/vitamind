#!/bin/sh

set -euf -o pipefail

BASEDIR=$(dirname "$0")
DATADIR=$BASEDIR/../../data/forecasts

echo "downloading weather from darksky"
python $BASEDIR/darksky_client.py $DATADIR/raw

echo "processing weather"
python $BASEDIR/darksky_transform.py $DATADIR/raw $DATADIR/forecasts
python $BASEDIR/evaluate_weath.py $DATADIR/forecasts $DATADIR/evaluated
