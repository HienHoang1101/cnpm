#!/usr/bin/env bash
set -euo pipefail

# Usage: set SLACK_WEBHOOK_FASTFOOD and optionally SLACK_WEBHOOK_DEFAULT in env,
# then run this script from the monitoring/alertmanager folder.

HERE=$(cd "$(dirname "$0")" && pwd)
TEMPLATE="$HERE/alertmanager.yml.tpl"
OUTDIR="$HERE/generated"
OUTFILE="$OUTDIR/alertmanager.yml"

if [ -z "${SLACK_WEBHOOK_FASTFOOD:-}" ]; then
  echo "ERROR: SLACK_WEBHOOK_FASTFOOD is not set. Export it and retry." >&2
  exit 2
fi

mkdir -p "$OUTDIR"

SLACK_DEFAULT=${SLACK_WEBHOOK_DEFAULT:-@@SLACK_DEFAULT@@}

# Replace placeholders in template
sed "s|@@SLACK_FASTFOOD@@|${SLACK_WEBHOOK_FASTFOOD}|g; s|@@SLACK_DEFAULT@@|${SLACK_DEFAULT}|g" "$TEMPLATE" > "$OUTFILE"

echo "Generated $OUTFILE"

echo "To run Alertmanager with this config using docker-compose, mount the generated file:\n  - ./monitoring/alertmanager/generated/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro"
