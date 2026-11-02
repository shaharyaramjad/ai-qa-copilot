#!/usr/bin/env bash
# Runs the test-reviewer agent on a spec file, or on every spec in a folder (one run per file,
# so free models do not cut the answer off). Saves the combined report to ai-output/.
# Usage: npm run review -- tests/login.spec.ts
#        npm run review -- fixtures/bad-tests        (self-check with planted bad tests)
set -u
cd "$(dirname "$0")/.."
TARGET="${1:-tests}"
[ -e "$TARGET" ] || { echo "Not found: $TARGET"; exit 1; }
[ -f .env ] || { echo "Missing .env. Copy .env.example to .env and add your key."; exit 1; }
command -v opencode >/dev/null 2>&1 || { echo "OpenCode is not installed: npm install -g opencode-ai"; exit 1; }
set -a; . ./.env; set +a
mkdir -p ai-output
NAME="$(echo "$TARGET" | tr '/.' '--')"
OUT="ai-output/review-$NAME.md"

if [ -d "$TARGET" ]; then FILES=$(ls "$TARGET"/*.ts); else FILES="$TARGET"; fi

review_one() {
  # Up to 3 tries of at most 3 minutes each: a complete report ends with a "Summary:" line.
  for attempt in 1 2 3; do
    RAW="$(perl -e 'alarm 180; exec @ARGV' opencode run --agent test-reviewer "Review the file $1. Read it and any page objects it uses. Follow your instructions exactly and finish with the Summary line." 2>&1)"
    RC=$?
    if printf '%s\n' "$RAW" | grep -q 'All models exhausted'; then
      echo "REVIEWER UNAVAILABLE: the free models are rate-limited or cannot use tools right now. Wait for the limits to reset (the router says how long) or add another free provider key, then run: npm run review -- $1"
      printf '%s\n' "$RAW" | grep 'All models exhausted' | cut -c1-300
      return 3
    fi
    REPORT="$(printf '%s\n' "$RAW" | awk '/^[[:space:]]*\|/ {p=1} p')"
    if printf '%s\n' "$REPORT" | grep -Eq '^[[:space:]*]*Summary:'; then
      # The free model sometimes miscounts in its own Summary line, so we count it ourselves.
      TABLE="$(printf '%s\n' "$REPORT" | grep -Ev '^[[:space:]*]*Summary:')"
      BAD=$(printf '%s\n' "$TABLE" | awk -F'|' '$3 ~ /PROBLEM/ { gsub(/^ +| +$/, "", $2); if ($2 != "Global") seen[$2]=1 } END { n=0; for (k in seen) n++; print n }')
      ROWS=$(printf '%s\n' "$TABLE" | grep -c 'PROBLEM')
      TOTAL=$(grep -cE '^[[:space:]]*test(\.(skip|fixme))?\(' "$1")
      printf '%s\n' "$TABLE"
      echo "Summary (counted by the script): $BAD of $TOTAL tests have problems, $ROWS findings."
      return 0
    fi
    RAWFILE="ai-output/review-raw-$NAME-attempt$attempt.txt"
    printf '%s\n' "$RAW" > "$RAWFILE"
    echo "(attempt $attempt gave an incomplete answer, exit code $RC, raw reply saved to $RAWFILE, retrying)" >&2
  done
  echo "INCOMPLETE REPORT for $1 after 3 attempts"
  return 1
}

: > "$OUT"
for f in $FILES; do
  echo "== $f" | tee -a "$OUT"
  review_one "$f" | tee -a "$OUT"
  echo | tee -a "$OUT"
done
echo "Saved: $OUT"
