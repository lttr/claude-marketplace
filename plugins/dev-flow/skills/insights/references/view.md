# insights view

Generate interactive HTML dashboard from `.insights/` data.

## Args

| Flag       | Effect                            |
| ---------- | --------------------------------- |
| (none)     | static `.insights/dashboard.html` |
| `--serve`  | start local dev server            |
| `--port N` | server port (default 3456)        |
| `--open`   | open browser after generation     |

## Pre-req

`.insights/` must exist. If missing → tell user to run `/dev-flow:insights daily` or `/dev-flow:insights catchup` first.

## Static

```bash
deno run --allow-read --allow-write --allow-net \
  ${CLAUDE_SKILL_DIR}/dashboard/generate.ts --open
```

## Server

```bash
deno run --allow-read --allow-write --allow-net \
  ${CLAUDE_SKILL_DIR}/dashboard/generate.ts --serve --open
```

## Output

- Static: `.insights/dashboard.html`
- Server: `http://localhost:3456`

## Features

1. Stats bar (PR / commit / work item / report counts)
2. Charts tab (PR status, commits by author, work item states, activity timeline)
3. Reports tab (browse generated markdown)
4. Raw data tab (clickable tables with AZDO + Confluence links)
