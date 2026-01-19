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

- `$ARGUMENTS` - Optional date within target week

## Date Defaults

When no date is provided, defaults to **previous complete week** (Mon-Sun), not the current incomplete week.

## Workflow

### 1. Determine Target Week

```bash
if [ -n "$ARGUMENTS" ]; then
  DATE="$ARGUMENTS"
else
  # Default to previous complete week
  # Go back 7 days, then find that week's Monday
  WEEK_AGO=$(date -d "-7 days" +%Y-%m-%d)
  DATE=$(date -d "$WEEK_AGO -$(date -d $WEEK_AGO +%u) days + 1 day" +%Y-%m-%d)
fi
echo "Target week containing: $DATE"
```

### 2. Auto-Catchup (when no date argument)

If `$ARGUMENTS` is empty, check for data gaps and run catchup:

```bash
if [ -z "$ARGUMENTS" ] && [ -f .insights/raw/commits.json ]; then
  LAST_DATE=$(cat .insights/raw/commits.json | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const dates = data.map(d => d.date).filter(Boolean).sort();
    console.log(dates[dates.length - 1] || '');
  ")
  if [ -n "$LAST_DATE" ]; then
    DAYS_GAP=$(( ($(date +%s) - $(date -d "$LAST_DATE" +%s)) / 86400 ))
    if [ $DAYS_GAP -gt 7 ]; then
      echo "Gap detected: $DAYS_GAP days since $LAST_DATE. Running catchup..."
      DAYS_GAP=$((DAYS_GAP + 1))  # buffer
      [ $DAYS_GAP -gt 90 ] && DAYS_GAP=90
      node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/azure-prs.js --days $DAYS_GAP
      node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/azure-workitems.js --days $DAYS_GAP
      node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/git-commits.js --days $DAYS_GAP
    fi
  fi
fi
```

Skip catchup when explicit date provided (user wants specific week only).

### 3. Collect Data

Run collectors to gather the week's data (if catchup didn't already cover it):

```bash
# Collect 7 days of data
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/azure-prs.js --days 7
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/azure-workitems.js --days 7
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/git-commits.js --days 7
```

### 4. Filter Data

Filter each data source for the target week (Mon-Sun):

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/filter-by-date.js .insights/raw/prs.json --week $DATE > /tmp/prs.json
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/filter-by-date.js .insights/raw/workitems.json --week $DATE > /tmp/workitems.json
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/filter-by-date.js .insights/raw/commits.json --week $DATE > /tmp/commits.json
```

The filter outputs the ISO week (e.g., `2025-W02`) to stderr for naming.

### 5. Confluence (Optional)

If Atlassian MCP tools are available:

- Search for pages modified during the week
- Look for documentation related to merged PRs
- Include relevant context from project spaces

Skip silently if MCP tools are not configured.

### 6. Generate Summary

Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/insights/templates/weekly-summary.md`.

Generate a comprehensive weekly summary covering:

- PR activity with review patterns
- Commit themes and patterns
- Work item progress
- Contributors and their focus areas
- Notable highlights

### 7. Save Output

Save the report to `.insights/YYYY-WXX-insights.md` (ISO week format).

### 8. Cleanup

Remove temporary filtered files after the report is saved:

```bash
rm -f /tmp/prs.json /tmp/workitems.json /tmp/commits.json
```

## Output

Report includes:

- Overview of the week
- PR summary table with status
- Commit activity by area and contributor
- Work item sprint progress
- Themes and patterns identified
- Highlights and looking ahead
