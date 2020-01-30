#!/bin/sh

set -euf -o pipefail

BASEDIR=$(dirname "$0")
DATADIR=$BASEDIR/../data/forecasts/darksky_raw

mkdir -p $DATADIR
rm $DATADIR/*.json

echo "downloading weather from darksky"

python $BASEDIR/forecasts/darksky_client.py $DATADIR/darksky_raw
python $BASEDIR/forecasts/darksky_import.py $DATADIR/darksky_raw

echo "processing forecasts"
python $BASEDIR/forecasts/process_forecasts.py
