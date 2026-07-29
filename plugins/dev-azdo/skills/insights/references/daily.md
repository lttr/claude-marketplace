# insights daily

Generate a daily codebase activity report.

## Input

`$ARGUMENTS` after `daily`:

- empty → smart default
- `YYYY-MM-DD` → that date

## Date Defaults (no arg)

| Today   | Target          |
| ------- | --------------- |
| Mon     | Last Friday     |
| Tue–Fri | Yesterday       |
| Sat     | Yesterday (Fri) |
| Sun     | Last Friday     |

## Workflow

### 1. Resolve target date

```bash
if [ -n "$DATE_ARG" ]; then
  DATE="$DATE_ARG"
else
  DOW=$(date +%u)
  case $DOW in
    1) DATE=$(date -d "last Friday" +%Y-%m-%d) ;;
    6) DATE=$(date -d "yesterday" +%Y-%m-%d) ;;
    7) DATE=$(date -d "last Friday" +%Y-%m-%d) ;;
    *) DATE=$(date -d "yesterday" +%Y-%m-%d) ;;
  esac
fi
```

### 2. Auto-catchup (only when no explicit date)

If `.insights/raw/commits.json` exists, find last collected date, compute gap, run collectors with `--days $((gap+1))` (capped 90).

```bash
node ${CLAUDE_SKILL_DIR}/collectors/azure-prs.js --days $DAYS_GAP
node ${CLAUDE_SKILL_DIR}/collectors/azure-workitems.js --days $DAYS_GAP
node ${CLAUDE_SKILL_DIR}/collectors/git-commits.js --days $DAYS_GAP
```

Skip catchup when explicit date given.

### 3. Collect (1-day default if no catchup)

```bash
node ${CLAUDE_SKILL_DIR}/collectors/azure-prs.js --days 1
node ${CLAUDE_SKILL_DIR}/collectors/azure-workitems.js --days 1
node ${CLAUDE_SKILL_DIR}/collectors/git-commits.js --days 1
```

### 4. Filter by date

```bash
node ${CLAUDE_SKILL_DIR}/collectors/filter-by-date.js .insights/raw/prs.json       --day $DATE > /tmp/prs.json
node ${CLAUDE_SKILL_DIR}/collectors/filter-by-date.js .insights/raw/workitems.json --day $DATE > /tmp/workitems.json
node ${CLAUDE_SKILL_DIR}/collectors/filter-by-date.js .insights/raw/commits.json   --day $DATE > /tmp/commits.json
```

### 5. Confluence (optional)

Atlassian MCP available → search recently modified pages, fetch relevant content. Else skip silently.

### 6. Generate summary

Read template `${CLAUDE_SKILL_DIR}/templates/daily-summary.md`. Combine all sources.

### 7. Save

```
.insights/$DATE-insights.md
```

### 8. Cleanup

```bash
rm -f /tmp/prs.json /tmp/workitems.json /tmp/commits.json
```

### 9. Open dashboard

```bash
deno run --allow-read --allow-write --allow-net \
  ${CLAUDE_SKILL_DIR}/dashboard/generate.ts --open
xdg-open .insights/dashboard.html
```

## Output

- PR activity (opened, merged, in review)
- Commits by author/area
- Work item state changes
- Key changes synthesis
