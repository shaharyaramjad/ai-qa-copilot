#!/usr/bin/env bash
# Runs ONE test many times (in parallel, to add load) and reports how often it passes.
# Usage: npm run flaky -- <spec file> <test id> [runs=10] [workers=4]
#        npm run flaky -- fixtures/flaky/flaky-1.spec.ts TC-FLAKY-01
set -u
cd "$(dirname "$0")/.."
SPEC="${1:-}"; ID="${2:-}"; RUNS="${3:-10}"; WORKERS="${4:-4}"
[ -n "$SPEC" ] && [ -n "$ID" ] || { echo "Usage: npm run flaky -- <spec file> <test id> [runs] [workers]"; exit 1; }
[ -f "$SPEC" ] || { echo "File not found: $SPEC"; exit 1; }
CFG=playwright.config.ts
case "$SPEC" in fixtures/*) CFG=playwright.fixtures.config.ts;; esac
mkdir -p test-results
echo "Running $ID $RUNS times with $WORKERS workers..."
PLAYWRIGHT_JSON_OUTPUT_NAME=test-results/flaky.json \
  npx playwright test "$SPEC" -g "$ID" -c "$CFG" --repeat-each="$RUNS" --workers="$WORKERS" --reporter=json >/dev/null 2>&1 || true
node scripts/flaky-report.mjs test-results/flaky.json "$ID" "$SPEC" "$RUNS" "$WORKERS"
