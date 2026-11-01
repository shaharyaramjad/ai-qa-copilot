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
  # Up to 3 tries: a complete report ends with a "Summary:" line.
  for attempt in 1 2 3; do
    RAW="$(opencode run --agent test-reviewer "Review the file $1. Read it and any page objects it uses. Follow your instructions exactly and finish with the Summary line." 2>&1)"
    REPORT="$(printf '%s\n' "$RAW" | awk '/^\|/ {p=1} p')"
    if printf '%s\n' "$REPORT" | grep -q '^Summary:'; then
      # The free model sometimes miscounts in its own Summary line, so we count it ourselves.
      TABLE="$(printf '%s\n' "$REPORT" | grep -v '^Summary:')"
      BAD=$(printf '%s\n' "$TABLE" | awk -F'|' '$3 ~ /PROBLEM/ { gsub(/^ +| +$/, "", $2); if ($2 != "Global") seen[$2]=1 } END { n=0; for (k in seen) n++; print n }')
      ROWS=$(printf '%s\n' "$TABLE" | grep -c 'PROBLEM')
      TOTAL=$(grep -cE '^[[:space:]]*test(\.(skip|fixme))?\(' "$1")
      printf '%s\n' "$TABLE"
      echo "Summary (counted by the script): $BAD of $TOTAL tests have problems, $ROWS findings."
      return 0
    fi
    echo "(attempt $attempt gave an incomplete answer, retrying)" >&2
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
