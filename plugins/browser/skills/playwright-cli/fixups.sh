#!/usr/bin/env bash
# Corrections applied to the vendored references after every re-vendor.
# Upstream assumes artifacts land in `.playwright-cli/` under the cwd; this
# plugin points outputDir at ~/.playwright/output (see check.sh), so the paths
# in the shipped docs would send the agent looking in the wrong place.
# Called by vendor.sh. Idempotent: safe to run on already-fixed files.
set -eu
cd "$(dirname "$0")"

# replace <file> <old> <new> -- plain-text substitution, no regex, no escaping
# rules to get wrong. Node does it because this plugin already requires node
# (playwright-cli is an npm binary); `sed -i` would need one form for GNU and
# another for BSD/macOS. Idempotent: a file already carrying <new> is skipped.
replace() {
  FIX_FILE="$1" FIX_OLD="$2" FIX_NEW="$3" node -e '
    const fs = require("fs");
    const { FIX_FILE: file, FIX_OLD: old, FIX_NEW: fresh } = process.env;
    if (!fs.existsSync(file)) {
      console.error(`fixups: ${file} not found (upstream renamed it?)`);
      process.exit(1);
    }
    const before = fs.readFileSync(file, "utf8");
    if (before.includes(fresh)) process.exit(0);          // already applied
    if (!before.includes(old)) {
      console.error(`fixups: pattern gone from ${file}: ${old}`);
      process.exit(1);
    }
    fs.writeFileSync(file, before.split(old).join(fresh));
  '
}

replace references/tracing.md \
  'Playwright creates a `.playwright-cli/traces/` directory' \
  'Playwright creates a `traces/` directory inside the configured output directory (`~/.playwright/output/traces/` with this plugin, `.playwright-cli/traces/` without a config)'

replace references/tracing.md \
  'find .playwright-cli/traces -mtime +7 -delete' \
  'find ~/.playwright/output/traces -mtime +7 -delete'

echo "fixups: references patched"
