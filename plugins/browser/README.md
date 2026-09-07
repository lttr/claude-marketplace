# browser

Browser automation for agents, built on the [`playwright-cli`](https://www.npmjs.com/package/@playwright/cli) CLI (`@playwright/cli`). Everything that depends on the browser-driving CLI lives here, so a future CLI swap touches one plugin.

## Skills

- **playwright-cli** - Drive a real browser: open pages, snapshot interactive elements, click/fill by ref, evaluate JS, screenshot. The official skill from `@playwright/cli`, vendored verbatim (see below). Model-invoked; the other skills build on it
- **showme** - Drive a headed browser to a described app state (a feature, a flow, a bug), verify it, then leave the window open for the user with a note on what to try. `/browser:showme`
- **page-bridge** - Inject a floating "agent" toolbar into a running dev page so the user can pick elements, comment on them, or send notes that arrive as live agent notifications. Project-agnostic, injected at runtime, no app code
- **pick** - One-shot element picker: attach to a debuggable Chrome or Edge (or launch one), inject a click-to-select overlay, return the CSS selector, tag, classes, and text. Starts the dev server if needed. `/browser:pick [prompt]`

`showme` and `pick` are manual only. `playwright-cli` and `page-bridge` load on their own when the conversation calls for them.

## Prerequisites

- **`playwright-cli` on PATH**: `npm install -g @playwright/cli` (or the global install of your package manager). The plugin bundles no dependencies.
- **A browser it can launch.** By default it uses the system Chrome on any OS. Without one, run `playwright-cli install-browser --with-deps` once.
- **Node >= 24** for `page-bridge` (its sink and driver are a single `.mjs` file).

Every skill starts with `skills/playwright-cli/check.sh` (portable bash), which verifies the binary and a browser launch. When something is missing it prints the exact install command and the skill stops there instead of guessing. `page-bridge`'s own driver refuses to run with the same message when the binary is absent. It also writes a global `~/.playwright/cli.config.json` on first run so snapshots, screenshots and traces go to `~/.playwright/output` instead of a `.playwright-cli/` folder in whatever project you happen to be in; a per-project `.playwright/cli.config.json` still overrides it. The path is generated with Node, so it is correct on Linux, macOS and Windows alike.

## Installation

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install browser@lttr-claude-marketplace --scope local
```

## Vendored official skill

`skills/playwright-cli/SKILL.md` and its `references/` are the skill Microsoft ships inside `@playwright/cli`, copied as-is apart from the corrections in `fixups.sh`, with this plugin's additions appended from `plugin-notes.md` (preflight, sessions, `--raw` output shape, snapshot litter, init scripts, CDP attach). Vendoring means installing the plugin is enough; nothing has to be run with `playwright-cli install-skills`. After upgrading `@playwright/cli`, run `skills/playwright-cli/vendor.sh` to re-copy from the installed package and commit the diff.

Vendored from `@playwright/cli` 0.1.19.

## Notes

- `page-bridge` and `pick` both point at elements. `pick` is the quick one-shot answer to "which element?"; `page-bridge` stays on the page and carries comments and notes, for longer design iterations.
- Each skill uses its own `playwright-cli` session (`-s=showme`, `-s=pick`), so they never disturb each other or the default session.
- `playwright-cli` writes a snapshot file after every command. The global config `check.sh` installs sends those to `~/.playwright/output` instead of a `.playwright-cli/` folder in the current project; every command prints the path of what it wrote.
