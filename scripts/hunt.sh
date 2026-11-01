#!/usr/bin/env bash
# Flaky hunt: runs the test many times, then asks the flaky-hunter agent for the root cause.
# Usage: npm run hunt -- <spec file> <test id> [runs] [workers]
set -u
cd "$(dirname "$0")/.."
SPEC="${1:-}"; ID="${2:-}"
[ -n "$SPEC" ] && [ -n "$ID" ] || { echo "Usage: npm run hunt -- <spec file> <test id> [runs] [workers]"; exit 1; }
command -v opencode >/dev/null 2>&1 || { echo "OpenCode is not installed: npm install -g opencode-ai"; exit 1; }
[ -f .env ] || { echo "Missing .env. Copy .env.example to .env and add your key."; exit 1; }
bash scripts/flaky.sh "$@" || exit 1
set -a; . ./.env; set +a
echo
echo "Asking the flaky-hunter agent..."
for attempt in 1 2 3; do
  RAW="$(opencode run --agent flaky-hunter "Investigate ai-output/flaky-$ID.md. The spec is $SPEC. Follow your instructions exactly and finish with the 'Do not do:' line." 2>&1)"
  REPORT="$(printf '%s\n' "$RAW" | awk '/^Verdict:/ {p=1} p')"
  if printf '%s\n' "$REPORT" | grep -q '^Do not do:'; then
    printf '%s\n' "$REPORT" | tee "ai-output/hunt-$ID.md"
    echo; echo "Saved: ai-output/hunt-$ID.md"; exit 0
  fi
  echo "(attempt $attempt gave an incomplete answer, retrying)" >&2
done
echo "The agent did not finish a complete report after 3 attempts. Evidence is in ai-output/flaky-$ID.md"
exit 1
