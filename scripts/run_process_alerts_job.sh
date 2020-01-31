#!/bin/sh

set -euf -o pipefail

BASEDIR=$(dirname "$0")

echo "processing latest forecast results"
python $BASEDIR/alerts/generate_alert_status.py

echo "sending alerts"
for i in "1 2 3 4 5"; do
  python $BASEDIR/alerts/process_user_alerts.py
done
