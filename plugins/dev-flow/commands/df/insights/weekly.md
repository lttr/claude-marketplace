---
name: df:insights:weekly
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
description: Generate weekly codebase activity summary from Azure DevOps, git, and optionally Confluence
arguments:
  - name: date
    description: Any date within the target week (YYYY-MM-DD), defaults to today
    required: false
---

# Weekly Codebase Insights

Generate a comprehensive summary of the week's codebase activity.

## Arguments

- `$ARGUMENTS` - Optional date within target week (defaults to current week)

## Workflow

### 1. Collect Data

Run collectors to gather the week's data:

```bash
DATE="${ARGUMENTS:-$(date +%Y-%m-%d)}"

# Collect 7 days of data
node $PLUGIN_DIR/collectors/azure-prs.js --days 7
node $PLUGIN_DIR/collectors/azure-workitems.js --days 7
node $PLUGIN_DIR/collectors/git-commits.js --days 7
```

### 2. Filter Data

Filter each data source for the target week (Mon-Sun):

```bash
node $PLUGIN_DIR/collectors/filter-by-date.js .insights/raw/prs.json --week $DATE > /tmp/prs.json
node $PLUGIN_DIR/collectors/filter-by-date.js .insights/raw/workitems.json --week $DATE > /tmp/workitems.json
node $PLUGIN_DIR/collectors/filter-by-date.js .insights/raw/commits.json --week $DATE > /tmp/commits.json
```

The filter outputs the ISO week (e.g., `2025-W02`) to stderr for naming.

### 3. Confluence (Optional)

If Atlassian MCP tools are available:

- Search for pages modified during the week
- Look for documentation related to merged PRs
- Include relevant context from project spaces

Skip silently if MCP tools are not configured.

### 4. Generate Summary

Read the template from `$PLUGIN_DIR/skills/insights/templates/weekly-summary.md`.

Generate a comprehensive weekly summary covering:

- PR activity with review patterns
- Commit themes and patterns
- Work item progress
- Contributors and their focus areas
- Notable highlights

### 5. Save Output

Save the report to `.insights/YYYY-WXX-insights.md` (ISO week format).

## Output

Report includes:

- Overview of the week
- PR summary table with status
- Commit activity by area and contributor
- Work item sprint progress
- Themes and patterns identified
- Highlights and looking ahead
