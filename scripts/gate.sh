#!/usr/bin/env bash
# Quality gate: typecheck, then the whole suite. Exit code 0 only if both pass.
# Run by hand with `npm run gate`; the OpenCode plugin (.opencode/plugins/test-gate.ts) runs it
# automatically when the AI finishes after editing tests/ or pages/.
set -uo pipefail
cd "$(dirname "$0")/.."

echo "== typecheck"
npm run -s typecheck || { echo "GATE FAILED: typecheck"; exit 1; }

echo "== tests"
npx playwright test --reporter=line || { echo "GATE FAILED: tests"; exit 1; }

echo "GATE PASSED"
