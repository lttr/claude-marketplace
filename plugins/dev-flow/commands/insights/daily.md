---
name: df:insights:daily
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

- `$ARGUMENTS` - Optional date in YYYY-MM-DD format

## Date Defaults

When no date is provided:

- **Monday** → Friday (last business day)
- **Tuesday-Friday** → Yesterday
- **Saturday/Sunday** → Friday

## Workflow

### 1. Determine Target Date

```bash
if [ -n "$ARGUMENTS" ]; then
  DATE="$ARGUMENTS"
else
  DOW=$(date +%u)  # 1=Mon, 7=Sun
  case $DOW in
    1) DATE=$(date -d "last Friday" +%Y-%m-%d) ;;      # Monday → Friday
    6) DATE=$(date -d "yesterday" +%Y-%m-%d) ;;        # Saturday → Friday
    7) DATE=$(date -d "last Friday" +%Y-%m-%d) ;;      # Sunday → Friday
    *) DATE=$(date -d "yesterday" +%Y-%m-%d) ;;        # Tue-Fri → yesterday
  esac
fi
echo "Target date: $DATE"
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
    if [ $DAYS_GAP -gt 1 ]; then
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

Skip catchup when explicit date provided (user wants specific day only).

### 3. Collect Data

Run collectors to gather fresh data (if catchup didn't already):

```bash
# Collect from all sources (1 day if no catchup ran)
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/azure-prs.js --days 1
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/azure-workitems.js --days 1
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/git-commits.js --days 1
```

### 4. Filter Data

Filter each data source for the target date:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/filter-by-date.js .insights/raw/prs.json --day $DATE > /tmp/prs.json
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/filter-by-date.js .insights/raw/workitems.json --day $DATE > /tmp/workitems.json
node ${CLAUDE_PLUGIN_ROOT}/skills/insights/collectors/filter-by-date.js .insights/raw/commits.json --day $DATE > /tmp/commits.json
```

### 5. Confluence (Optional)

If Atlassian MCP tools are available, search for related documentation changes:

- Use `mcp__plugin_triage_atlassian__search` to find recently modified pages
- Fetch page content if relevant

Skip silently if MCP tools are not configured.

### 6. Generate Summary

Read the template from `${CLAUDE_PLUGIN_ROOT}/skills/insights/templates/daily-summary.md`.

Combine all data sources and generate a comprehensive daily summary.

### 7. Save Output

Save the report to `.insights/$DATE-insights.md`.

### 8. Cleanup

Remove temporary filtered files after the report is saved:

```bash
rm -f /tmp/prs.json /tmp/workitems.json /tmp/commits.json
```

## Output

Report includes:

- Pull request activity (opened, merged, in review)
- Commit summary by author/area
- Work item state changes
- Key changes synthesis
