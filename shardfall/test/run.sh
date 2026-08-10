#!/usr/bin/env bash
# SHARDFALL headless test runner.
# Extracts the <script> block from index.html, prepends a DOM/canvas stub, runs each suite.
# No browser, no deps, no build step. Requires only node.
set -u
cd "$(dirname "$0")/.."
ROOT="$(pwd)"; TMP="$(mktemp -d)"
sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d' > "$TMP/game.js"

if ! node --check "$TMP/game.js"; then echo "SYNTAX ERROR in index.html"; exit 1; fi
echo "syntax OK"

FAIL=0
SUITES="${1:-2 3 4 5 6 7 8 9 10 11 12 13 14 15 16}"
for n in $SUITES; do
  S="$ROOT/test/suite-$n.js"
  [ -f "$S" ] || continue
  echo ""; echo "=== suite $n ==="
  cat "$ROOT/test/harness.js" "$TMP/game.js" "$S" > "$TMP/full-$n.js"
  node "$TMP/full-$n.js" || FAIL=1
done
rm -rf "$TMP"
echo ""
[ $FAIL -eq 0 ] && echo "=== ALL SUITES PASS ===" || echo "=== FAILURES ABOVE ==="
exit $FAIL
