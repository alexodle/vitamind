#!/bin/sh

set -euf -o pipefail

BASEDIR="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
DATADIR=$BASEDIR/../data/darksky_raw

rm -r $DATADIR
mkdir -p $DATADIR

echo "downloading weather from darksky"
python $BASEDIR/forecasts/darksky_client.py $DATADIR
python $BASEDIR/forecasts/darksky_import.py $DATADIR

echo "processing forecasts"
python $BASEDIR/forecasts/process_forecasts.py
