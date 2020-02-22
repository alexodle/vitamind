#!/bin/bash

set -euf -o pipefail

BASEDIR="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

$BASEDIR/run_darksky_forecast_job.sh
$BASEDIR/run_process_alerts_job.sh
