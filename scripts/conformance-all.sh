#!/usr/bin/env bash
# Runs the conformance check for every feature that has approved test cases (docs/test-cases/<feature>.md
# and tests/<feature>.spec.ts). No AI involved, so it is safe to run in CI.
set -u
cd "$(dirname "$0")/.."
status=0
for cases in docs/test-cases/*.md; do
  feature="$(basename "$cases" .md)"
  spec="tests/$feature.spec.ts"
  [ -f "$spec" ] || { echo "== $feature: no $spec, skipped"; continue; }
  echo "== $feature"
  node scripts/conformance.mjs "$spec" "$cases" | tail -1 || status=1
  node scripts/conformance.mjs "$spec" "$cases" >/dev/null || status=1
done
exit $status
