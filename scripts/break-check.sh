#!/usr/bin/env bash
# Break-the-app check: temporarily breaks ONE expectation in a test and confirms the test FAILS.
# A test that still passes when it should fail proves nothing.
# Usage: npm run break-check                      (default: tests/cart.spec.ts, TC-CART-02)
#        npm run break-check -- <spec file> <test id>
# The spec file is always restored afterwards, even if you press Ctrl+C.
set -uo pipefail
cd "$(dirname "$0")/.."

FILE="${1:-tests/cart.spec.ts}"
ID="${2:-TC-CART-02}"
[ -f "$FILE" ] || { echo "File not found: $FILE"; exit 1; }

BAK="$(mktemp)"
cp "$FILE" "$BAK"
trap 'cp "$BAK" "$FILE"; rm -f "$BAK"' EXIT

# Break the first expected text inside the chosen test: toHaveText('..'), toContainText('..') or expectError('..')
ID="$ID" perl -0pi -e 's/(test\(\x27$ENV{ID}(?:(?!\n\s*test\().)*?)\b(toHaveText|toContainText|expectError)\(([\x27\x22])(?:(?!\3).)*\3\)/$1$2(\x27BROKEN-ON-PURPOSE\x27)/s' "$FILE"

# No text found? Try a list of expected texts: toHaveText([...]), toContainText([...]) or toEqual([...])
if cmp -s "$FILE" "$BAK"; then
  ID="$ID" perl -0pi -e 's/(test\(\x27$ENV{ID}(?:(?!\n\s*test\().)*?)\b(toHaveText|toContainText|toEqual)\(\[(?:(?!\]\)).)*\]\)/$1$2([\x27BROKEN-ON-PURPOSE\x27])/s' "$FILE"
fi

if cmp -s "$FILE" "$BAK"; then
  echo "Could not break $ID automatically (no toHaveText / toContainText / expectError / toEqual with a text or list found in that test)."
  echo "Break it by hand instead: change one expected value, run the test, it must fail, then undo."
  exit 2
fi

echo "Broke $ID in $FILE on purpose. Running it (it SHOULD fail)..."
OUT="$(npx playwright test "$FILE" -g "$ID" --reporter=line 2>&1)"
STATUS=$?
echo "$OUT" | tail -15
echo
if [ $STATUS -ne 0 ] && echo "$OUT" | grep -q "BROKEN-ON-PURPOSE"; then
  echo "RESULT: PASS - $ID failed when broken, so it can catch errors. File restored."
elif [ $STATUS -ne 0 ]; then
  echo "RESULT: UNCLEAR - the test failed, but not on the broken value. Read the error above. File restored."
else
  echo "RESULT: FAIL - $ID still passed with a wrong expected value, so it cannot catch errors. File restored."
  exit 1
fi
