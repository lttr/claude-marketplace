---
allowed-tools:
  [
    "Bash",
    "Read",
    "Write",
    "Glob",
    "Grep",
    "mcp__plugin_triage_atlassian__search",
    "mcp__plugin_triage_atlassian__getConfluencePage",
  ]
description: Generate daily codebase activity summary from Azure DevOps, git, and optionally Confluence
arguments:
  - name: date
    description: Target date (YYYY-MM-DD), defaults to today
    required: false
---

# Daily Codebase Insights

Generate a summary of today's (or specified date's) codebase activity.

## Arguments

- `$ARGUMENTS` - Optional date in YYYY-MM-DD format (defaults to today)

## Workflow

### 1. Collect Data

Run collectors to gather fresh data:

```bash
DATE="${ARGUMENTS:-$(date +%Y-%m-%d)}"

# Collect from all sources
node $PLUGIN_DIR/collectors/azure-prs.js --days 1
node $PLUGIN_DIR/collectors/azure-workitems.js --days 1
node $PLUGIN_DIR/collectors/git-commits.js --days 1
```

### 2. Filter Data

Filter each data source for the target date:

```bash
node $PLUGIN_DIR/collectors/filter-by-date.js .insights/raw/prs.json --day $DATE > /tmp/prs.json
node $PLUGIN_DIR/collectors/filter-by-date.js .insights/raw/workitems.json --day $DATE > /tmp/workitems.json
node $PLUGIN_DIR/collectors/filter-by-date.js .insights/raw/commits.json --day $DATE > /tmp/commits.json
```

### 3. Confluence (Optional)

If Atlassian MCP tools are available, search for related documentation changes:

- Use `mcp__plugin_triage_atlassian__search` to find recently modified pages
- Fetch page content if relevant

Skip silently if MCP tools are not configured.

### 4. Generate Summary

Read the template from `$PLUGIN_DIR/skills/insights/templates/daily-summary.md`.

Combine all data sources and generate a comprehensive daily summary.

### 5. Save Output

Save the report to `.insights/$DATE-insights.md`.

## Output

Report includes:

- Pull request activity (opened, merged, in review)
- Commit summary by author/area
- Work item state changes
- Key changes synthesis
