#!/bin/sh

set -euf -o pipefail

BASEDIR=$(dirname "$0")
DATADIR=$BASEDIR/../../data/darksky_raw

mkdir -p $DATADIR
#rm $DATADIR/*.json

echo "downloading weather from darksky"

python $BASEDIR/darksky_client.py $DATADIR
python $BASEDIR/darksky_import.py $DATADIR

echo "processing forecasts"
python $BASEDIR/process_forecasts.py
