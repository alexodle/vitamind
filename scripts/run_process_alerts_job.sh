#!/bin/bash

set -euf -o pipefail

BASEDIR="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

echo "processing latest forecast results"
python $BASEDIR/alerts/generate_alert_status.py

echo "sending alerts"
for i in "1 2 3 4 5"; do
  python $BASEDIR/alerts/process_user_alerts.py
done
