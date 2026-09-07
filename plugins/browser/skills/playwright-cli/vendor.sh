#!/usr/bin/env bash
# Re-vendor the official playwright-cli skill from the installed @playwright/cli.
# Copies SKILL.md and references/ verbatim, appends the plugin notes kept in
# plugin-notes.md, then re-applies the corrections in fixups.sh. Run after
# upgrading @playwright/cli; commit the diff.
set -eu
cd "$(dirname "$0")"

command -v playwright-cli >/dev/null 2>&1 || { echo "playwright-cli not on PATH" >&2; exit 1; }
SRC=$(playwright-cli --help 2>/dev/null | sed -n 's/^Agent skill: //p' | head -1)
[ -n "$SRC" ] || { echo "could not find 'Agent skill:' in playwright-cli --help" >&2; exit 1; }
case "$SRC" in /*) ;; *) SRC="$PWD/$SRC" ;; esac   # help prints it relative to cwd
SRCDIR=$(dirname "$SRC")
[ -f "$SRC" ] || { echo "bundled skill not found at $SRC" >&2; exit 1; }

VERSION=$(playwright-cli --version 2>/dev/null | head -1)
mkdir -p references
cp -R "$SRCDIR/references/." references/
{
  cat "$SRC"
  printf '\n'
  cat plugin-notes.md
} > SKILL.md
./fixups.sh
VERSION="$VERSION" node -e '
  const fs = require("fs");
  const file = "../../README.md";
  const line = "Vendored from `@playwright/cli` ";
  const text = fs.readFileSync(file, "utf8");
  const stamped = text.replace(new RegExp("^" + line.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + ".*$", "m"), line + process.env.VERSION + ".");
  if (stamped === text) console.error(`vendor: no "${line}" line in ${file}; version not stamped`);
  else fs.writeFileSync(file, stamped);
' 
echo "vendored @playwright/cli $VERSION skill from $SRCDIR"
echo "check references/ for files the new version no longer ships (cp does not delete)"
