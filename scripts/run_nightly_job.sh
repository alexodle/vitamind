#!/bin/bash

set -euf -o pipefail

BASEDIR="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

for i in "1 2 3 4 5"; do
	$BASEDIR/run_darksky_forecast_job.sh && break
done

$BASEDIR/run_process_alerts_job.sh
