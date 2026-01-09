---
name: df:insights:catchup
allowed-tools:
  [
    "Bash",
    "Read",
    "Write",
    "Glob",
    "mcp__plugin_triage_atlassian__search",
  ]
description: Download raw insights data from last collection date until today
---

# Catch Up - Download Raw Insights Data

Download raw data from all sources covering the period since the last collection.

## Workflow

### 1. Detect Last Collection Date

Check `.insights/raw/` for existing data files and find the most recent date:

```bash
# Find most recent date in existing commits.json (if exists)
if [ -f .insights/raw/commits.json ]; then
  LAST_DATE=$(cat .insights/raw/commits.json | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const dates = data.map(d => d.date).filter(Boolean).sort();
    console.log(dates[dates.length - 1] || '');
  ")
fi
```

If no existing data, default to 30 days ago.

### 2. Calculate Days Since Last Collection

```bash
# Calculate days between LAST_DATE and today
TODAY=$(date +%Y-%m-%d)
DAYS=$(( ($(date -d "$TODAY" +%s) - $(date -d "$LAST_DATE" +%s)) / 86400 ))

# Add 1 day buffer for overlap
DAYS=$((DAYS + 1))

# Cap at reasonable maximum (90 days)
if [ $DAYS -gt 90 ]; then DAYS=90; fi
```

### 3. Collect All Data Sources

Run all collectors with the calculated day range:

```bash
node $PLUGIN_DIR/collectors/azure-prs.js --days $DAYS
node $PLUGIN_DIR/collectors/azure-workitems.js --days $DAYS
node $PLUGIN_DIR/collectors/git-commits.js --days $DAYS
```

### 4. Confluence (Optional)

If Atlassian MCP is available, search for pages modified since last collection:

- Use `mcp__plugin_triage_atlassian__search` with `modified:>LAST_DATE`
- Save results to `.insights/raw/confluence.json`

Skip silently if not configured.

### 5. Report

Output summary of what was collected:

- Date range covered
- Number of items per source
- Path to raw data files

## Output

Raw data saved to `.insights/raw/`:

- `prs.json` - Azure PRs
- `workitems.json` - Azure work items
- `commits.json` - Git commits
- `confluence.json` - Confluence pages (if available)

No summary report generated. Use `/df:insights:daily` or `/df:insights:weekly` to generate reports from the collected data.
