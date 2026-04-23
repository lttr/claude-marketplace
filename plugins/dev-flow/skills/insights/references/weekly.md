# insights weekly

Generate a weekly codebase activity report.

## Input

`$ARGUMENTS` after `weekly`:

- empty → previous complete week (Mon–Sun)
- `YYYY-MM-DD` → week containing that date

## Workflow

### 1. Resolve target week

```bash
if [ -n "$DATE_ARG" ]; then
  DATE="$DATE_ARG"
else
  WEEK_AGO=$(date -d "-7 days" +%Y-%m-%d)
  DATE=$(date -d "$WEEK_AGO -$(date -d $WEEK_AGO +%u) days + 1 day" +%Y-%m-%d)
fi
```

### 2. Auto-catchup (only when no explicit date)

Same as daily, but trigger threshold = gap > 7 days.

```bash
node ${CLAUDE_SKILL_DIR}/collectors/azure-prs.js --days $DAYS_GAP
node ${CLAUDE_SKILL_DIR}/collectors/azure-workitems.js --days $DAYS_GAP
node ${CLAUDE_SKILL_DIR}/collectors/git-commits.js --days $DAYS_GAP
```

### 3. Collect (7-day default)

```bash
node ${CLAUDE_SKILL_DIR}/collectors/azure-prs.js --days 7
node ${CLAUDE_SKILL_DIR}/collectors/azure-workitems.js --days 7
node ${CLAUDE_SKILL_DIR}/collectors/git-commits.js --days 7
```

### 4. Filter by week

```bash
node ${CLAUDE_SKILL_DIR}/collectors/filter-by-date.js .insights/raw/prs.json       --week $DATE > /tmp/prs.json
node ${CLAUDE_SKILL_DIR}/collectors/filter-by-date.js .insights/raw/workitems.json --week $DATE > /tmp/workitems.json
node ${CLAUDE_SKILL_DIR}/collectors/filter-by-date.js .insights/raw/commits.json   --week $DATE > /tmp/commits.json
```

Filter prints ISO week (e.g. `2025-W02`) on stderr — use for filename.

### 5. Confluence (optional)

Search pages modified during the week, related to merged PRs.

### 6. Generate summary

Template: `${CLAUDE_SKILL_DIR}/templates/weekly-summary.md`. Cover:

- PR activity + review patterns
- Commit themes
- Work-item progress
- Contributors + focus areas
- Highlights

### 7. Save

```
.insights/YYYY-WXX-insights.md
```

### 8. Cleanup

```bash
rm -f /tmp/prs.json /tmp/workitems.json /tmp/commits.json
```
