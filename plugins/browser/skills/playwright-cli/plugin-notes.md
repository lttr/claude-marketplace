## Plugin notes (browser plugin)

This section is what the browser plugin adds. Everything preceding it in
SKILL.md is the official skill vendored verbatim from `@playwright/cli`; re-sync
it with `vendor.sh` after upgrading, which also re-applies `fixups.sh`.

### Preflight

Before the first `playwright-cli` command in a session, run:

```bash
${CLAUDE_PLUGIN_ROOT}/skills/playwright-cli/check.sh
```

Exit 0 means the binary is on PATH and a browser launches. On any other exit,
stop and relay its output to the user verbatim: it names the missing piece and
the command that installs it. Do not fall back to another automation tool and
do not install anything yourself.

### Sessions

Skills in this plugin use named sessions (`-s=showme`, `-s=pick`, and
`BRIDGE_SESSION` for page-bridge) so they never trample each other or the
default session. `playwright-cli list` shows what is open.

### Output for scripts

`--raw eval` prints the value **JSON-serialized**: strings come back quoted
(`"about:blank"`), objects pretty-printed over several lines, `undefined`
literally (which does not parse). `JSON.parse` the output. `eval` takes an
expression, not statements; wrap anything with a body in an arrow function:
`eval "() => { ...; return x }"`.

### Files

By default every command writes its snapshots, screenshots and traces into
`.playwright-cli/` under the shell's cwd. The preflight above installs a global
`~/.playwright/cli.config.json` pointing `outputDir` at `~/.playwright/output`,
which redirects that for every session and keeps projects clean. Config layers,
lowest priority first: the global file, a per-project
`.playwright/cli.config.json` in the cwd, then `PLAYWRIGHT_MCP_OUTPUT_DIR`.

`outputDir` must be an **absolute** path. A relative one resolves against the
cwd, not against the config's own directory, so it pollutes projects exactly
like the default. The config is read when a session daemon starts, so an
override must be set on the `open` / `attach` command, not on later commands
against a live session.

Artifact filenames are millisecond-timestamped, so one shared directory across
projects and concurrent sessions does not collide. Every command prints the
path of what it wrote -- read that, never guess or glob the directory. Pass
absolute `--filename` paths when a file must land somewhere specific.

### Package managers

The vendored docs above write `npx playwright test` and `npm install -g`. Those
are stand-ins: run the equivalent for whatever the repo actually uses.

### Persistent scripts on the page

`run-code` is how to install anything that must survive reloads, navigation and
new tabs:

```bash
playwright-cli run-code "async page => { await page.context().addInitScript(() => { window.__x = 1 }) }"
```

### Attaching to a running browser

`attach --cdp=http://localhost:9222` connects to a Chrome or Edge started with
`--remote-debugging-port`. Tabs are explicit: `tab-list`, then `tab-select <n>`;
every later command targets that tab. `detach` (or `close`) drops the connection
and leaves the external browser running.
