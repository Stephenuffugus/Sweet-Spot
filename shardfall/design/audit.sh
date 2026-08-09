#!/usr/bin/env bash
# Regenerate design/CURRENT-STATE.md from the live tables in index.html.
# The plan cites real numbers; this is what keeps them real.
set -eu
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d' > "$TMP/game.js"
cat test/harness.js "$TMP/game.js" design/audit.js > "$TMP/full.js"
node "$TMP/full.js" > design/CURRENT-STATE.md
rm -rf "$TMP"
echo "design/CURRENT-STATE.md regenerated ($(wc -l < design/CURRENT-STATE.md) lines)"
