#!/usr/bin/env bash
set -euo pipefail

# validate_dashboards.sh - validate all JSON dashboards under monitoring/grafana/dashboards
# Requires: jq

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DASH_DIR="$ROOT/grafana/dashboards"

if ! command -v jq >/dev/null 2>&1; then
  echo "Please install 'jq' to validate dashboards." >&2
  exit 2
fi

errors=0
find "$DASH_DIR" -type f -name '*.json' | while read -r file; do
  echo "Validating $file"
  if ! jq empty "$file" >/dev/null 2>&1; then
    echo "  -> Invalid JSON: $file" >&2
    errors=$((errors+1))
    continue
  fi
  # Check minimal fields
  has_uid=$(jq -r '.uid // empty' "$file")
  has_title=$(jq -r '.title // empty' "$file")
  if [ -z "$has_uid" ] || [ -z "$has_title" ]; then
    echo "  -> Missing required 'uid' or 'title' in $file" >&2
    errors=$((errors+1))
  else
    echo "  -> OK (uid=$has_uid title=$has_title)"
  fi
done

if [ "$errors" -ne 0 ]; then
  echo "Found $errors dashboard validation errors." >&2
  exit 1
fi

echo "All dashboards validated successfully."
