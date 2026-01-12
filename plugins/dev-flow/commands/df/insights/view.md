---
name: df:insights:view
description: Generate interactive dashboard from insights data
---

# Insights Dashboard Generator

Generate a self-contained HTML dashboard from `.insights/` data.

## Arguments

- `--serve` - Start local dev server instead of writing static file
- `--port <N>` - Server port (default: 3456)
- `--open` - Open browser after generation

## Prerequisites

Ensure you have insights data by running one of:

- `/df:insights:daily` - Generate daily summary
- `/df:insights:catchup` - Collect historical data

## Usage

**Generate static HTML:**

```bash
deno run --allow-read --allow-write --allow-net \
  ${CLAUDE_PLUGIN_ROOT}/skills/insights/dashboard/generate.ts --open
```

**Start dev server:**

```bash
deno run --allow-read --allow-write --allow-net \
  ${CLAUDE_PLUGIN_ROOT}/skills/insights/dashboard/generate.ts --serve --open
```

## Output

- Static mode: Creates `.insights/dashboard.html`
- Server mode: Serves at `http://localhost:3456`

## Features

The dashboard includes:

1. **Stats Bar** - PR, commit, work item, report counts
2. **Charts Tab** - PR status, commits by author, work item states, activity timeline
3. **Reports Tab** - Browse and read generated markdown reports
4. **Raw Data Tab** - Clickable tables with links to Azure DevOps and Confluence

## Instructions

1. Check if `.insights/` directory exists
2. If not, inform user to run `/df:insights:daily` or `/df:insights:catchup` first
3. Run the generator with appropriate flags based on user request
4. Report the output location or server URL
