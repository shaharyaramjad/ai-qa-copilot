#!/usr/bin/env bash
# Bug demo: runs the sorting tests as two users and shows that the tests catch a real app bug.
#   standard_user  = the normal user, sorting works      -> tests should PASS
#   problem_user   = SauceDemo's user with known bugs     -> if sorting is broken for this user, tests should FAIL
# Usage: npm run bug-demo            (optionally: npm run bug-demo -- tests/other.spec.ts)
set -u
cd "$(dirname "$0")/.."
SPEC="${1:-tests/sorting.spec.ts}"
run() {
  SAUCE_USER="$1" npx playwright test "$SPEC" --reporter=list 2>&1 | grep -E "✓|✘|passed|failed" 
}
echo "=== as standard_user (expected: all pass) ==="
run standard_user
echo
echo "=== as problem_user (expected: the tests catch the bugs) ==="
run problem_user
echo
echo "Read the second block: every ✘ is a bug in the app that the tests caught."
