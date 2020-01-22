#!/bin/sh

set -euf -o pipefail

BASEDIR=$(dirname "$0")
DATADIR=$BASEDIR/../../data/forecasts

echo "downloading weather from darksky"
python $BASEDIR/darksky_client.py $DATADIR/darksky_raw
python $BASEDIR/darksky_import.py $DATADIR/darksky_raw

echo "processing forecasts"
python $BASEDIR/process_forecasts.py
