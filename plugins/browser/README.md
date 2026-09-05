# browser

Browser automation for agents, built on the [`agent-browser`](https://github.com/vercel-labs/agent-browser) CLI. Everything that depends on the browser-driving CLI lives here, so a future CLI swap touches one plugin.

## Skills

- **agent-browser** - Drive a real browser: open pages, snapshot interactive elements, click/fill by ref, extract content, screenshot. Model-invoked; the other skills build on it
- **showme** - Drive a headed browser to a described app state (a feature, a flow, a bug), verify it, then leave the window open for the user with a note on what to try. `/browser:showme`
- **page-bridge** - Inject a floating "agent" toolbar into a running dev page so the user can pick elements, comment on them, or send notes that arrive as live agent notifications. Project-agnostic, injected over CDP, no app code
- **pick** - One-shot element picker: connect to a debuggable Chrome or Edge (or launch one), inject a click-to-select overlay, return the CSS selector, tag, classes, and text. Starts the dev server if needed. `/browser:pick [prompt]`

`showme` and `pick` are manual only. `agent-browser` and `page-bridge` load on their own when the conversation calls for them.

## Prerequisites

- **`agent-browser` on PATH**, installed by whatever manages your global binaries (for example vite-plus, `npm i -g agent-browser`, or the vendor's install script). The plugin bundles no dependencies and has no setup step; if the binary is missing, the skills stop and say so.
- **Node >= 24** for `page-bridge` (its sink and driver are a single `.mjs` file).
- **A Chromium browser** for `pick` when nothing debuggable is already listening.

## Installation

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install browser@lttr-claude-marketplace --scope local
```

## Notes

- `page-bridge` and `pick` both point at elements. `pick` is the quick one-shot answer to "which element?"; `page-bridge` stays on the page and carries comments and notes, for longer design iterations.
- The `agent-browser` skill documents two screenshot traps in `agent-browser` 0.35.1 (the `--full` flag and daemon-relative paths). Read it before taking screenshots.
