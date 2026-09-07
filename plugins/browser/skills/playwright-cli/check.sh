#!/usr/bin/env bash
# Preflight for the browser plugin: is playwright-cli installed and can it
# launch a browser? Prints what is wrong and how to fix it; exit 0 only when
# everything works. Every skill in this plugin runs this first.
# Portable: bash 3.2+, no GNU-only tools.
set -u
SESSION="pwcheck-$$"

if ! command -v playwright-cli >/dev/null 2>&1; then
  cat >&2 <<'MSG'
browser plugin: `playwright-cli` is not on PATH.

Install it globally with your Node package manager, then run this check again:
  npm install -g @playwright/cli
(or the equivalent for pnpm / bun / vite-plus: `vp install -g @playwright/cli`)
MSG
  exit 1
fi

# Keep snapshots, screenshots and traces out of the project: the global config
# at ~/.playwright/cli.config.json is the lowest-priority layer for every
# session, so a per-project .playwright/cli.config.json still wins. It is read
# when a session daemon starts, which is why this runs before any command.
# outputDir must be ABSOLUTE -- a relative path resolves against the cwd, which
# is the pollution we are avoiding. Node writes it so the path and its JSON
# escaping are correct on every OS (Windows backslashes included); node ships
# with playwright-cli, so it is always available here.
CONFIG_STATUS=$(node -e '
  const fs = require("fs"), os = require("os"), path = require("path");
  const dir = path.join(os.homedir(), ".playwright");
  const config = path.join(dir, "cli.config.json");
  const outputDir = path.join(dir, "output");
  const RETENTION_DAYS = 30;
  // playwright-cli writes a snapshot, console log or screenshot per command
  // into this one flat directory and never prunes it, so it grows without
  // bound across sessions. Drop what is older than the retention window.
  // Age-based on purpose: concurrent sessions share the directory, and nothing
  // a live one wrote is 30 days old, so this cannot race them -- a count-based
  // cap could delete another session artifacts while it is still running.
  // Swallows every error: a read-only directory, or a file removed by another
  // session mid-loop, must never stop a browser from launching.
  const prune = (target) => {
    const cutoff = Date.now() - RETENTION_DAYS * 86400000;
    try {
      for (const name of fs.readdirSync(target)) {
        const file = path.join(target, name);
        try {
          const stat = fs.statSync(file);
          if (stat.isFile() && stat.mtimeMs < cutoff) fs.unlinkSync(file);
        } catch {}
      }
    } catch {}
  };
  if (!fs.existsSync(config)) {
    fs.mkdirSync(outputDir, { recursive: true });
    prune(outputDir);
    fs.writeFileSync(config, JSON.stringify({ outputDir }, null, 2) + "\n");
    process.stdout.write("wrote " + config + " (outputDir: " + outputDir + ")");
    process.exit(0);
  }
  let existing;
  try { existing = JSON.parse(fs.readFileSync(config, "utf8")) } catch {
    process.stdout.write("WARN:" + config + " is not valid JSON; playwright-cli may ignore it");
    process.exit(0);
  }
  const set = existing.outputDir;
  if (!set) {
    process.stdout.write("WARN:" + config + " has no \"outputDir\"; artifacts land in .playwright-cli/ under the cwd");
  } else if (!path.isAbsolute(set)) {
    process.stdout.write("WARN:" + config + " outputDir \"" + set + "\" is relative, so it resolves against the cwd; use an absolute path");
  } else {
    fs.mkdirSync(set, { recursive: true });
    prune(set);
    process.stdout.write("global config: " + config + " (outputDir: " + set + ")");
  }
' 2>&1) || CONFIG_STATUS="WARN:could not read or write ~/.playwright/cli.config.json"
case "$CONFIG_STATUS" in
  WARN:*) echo "browser plugin: ${CONFIG_STATUS#WARN:}" >&2 ;;
  *) echo "$CONFIG_STATUS" ;;
esac

VERSION=$(playwright-cli --version 2>/dev/null | head -n 1)
echo "playwright-cli ${VERSION:-unknown version} at $(command -v playwright-cli)"

# playwright-cli has its own launch timeout, so no external `timeout` needed.
OUT=$(playwright-cli -s="$SESSION" open about:blank 2>&1)
STATUS=$?
playwright-cli -s="$SESSION" close >/dev/null 2>&1
if [ "$STATUS" -ne 0 ] || ! printf '%s\n' "$OUT" | grep -q "Page URL"; then
  cat >&2 <<MSG
browser plugin: \`playwright-cli\` is installed but could not launch a browser.

$(printf '%s\n' "$OUT" | tail -n 8)

By default it launches the system Chrome. Either install Google Chrome, or
download Playwright's own browser once (adds missing system libraries too):
  playwright-cli install-browser --with-deps
MSG
  exit 1
fi
echo "browser launch: ok"
