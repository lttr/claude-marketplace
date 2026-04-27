# insights catchup

Download raw data from all sources covering the period since last collection. No report generated.

## Workflow

### 1. Detect last collection date

```bash
if [ -f .insights/raw/commits.json ]; then
  LAST_DATE=$(cat .insights/raw/commits.json | node -e "
    const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const dates = data.map(d => d.date).filter(Boolean).sort();
    console.log(dates[dates.length - 1] || '');
  ")
fi
```

No data → default 30 days back.

### 2. Compute days

```bash
TODAY=$(date +%Y-%m-%d)
DAYS=$(( ($(date -d "$TODAY" +%s) - $(date -d "$LAST_DATE" +%s)) / 86400 ))
DAYS=$((DAYS + 1))            # buffer
[ $DAYS -gt 90 ] && DAYS=90    # cap
```

### 3. Collect

```bash
node ${CLAUDE_SKILL_DIR}/collectors/azure-prs.js --days $DAYS
node ${CLAUDE_SKILL_DIR}/collectors/azure-workitems.js --days $DAYS
node ${CLAUDE_SKILL_DIR}/collectors/git-commits.js --days $DAYS
```

### 4. Confluence (optional)

Atlassian MCP → search `modified:>$LAST_DATE`, save to `.insights/raw/confluence.json`.

### 5. Report

- Date range covered
- Items per source
- Path to raw data files

Use `/df:insights daily` or `/df:insights weekly` to generate reports from collected data.
