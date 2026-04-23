---
name: insights
description: Generate codebase activity summaries (daily/weekly/catchup/view) from Azure DevOps PRs, work items, local git, and optionally Confluence. Trigger when user says "/dev-flow:insights", asks "what happened", "codebase activity", "team summary", or wants a PR/commit roll-up.
---

# Insights

Multi-op skill. Dispatch on first word of `$ARGUMENTS`.

## Dispatch

| Op          | First word         | Reference               |
| ----------- | ------------------ | ----------------------- |
| **daily**   | `daily [date]`     | `references/daily.md`   |
| **weekly**  | `weekly [date]`    | `references/weekly.md`  |
| **catchup** | `catchup`          | `references/catchup.md` |
| **view**    | `view` (dashboard) | `references/view.md`    |

Empty / unknown → ask user.

## Data Sources

| Source           | Tool               | Data                                    |
| ---------------- | ------------------ | --------------------------------------- |
| Azure PRs        | `az repos pr list` | PRs opened, merged, reviewed            |
| Azure Work Items | `az boards query`  | Tickets started, completed, in progress |
| Local Git        | `git log`          | Commits in current repo                 |
| Confluence       | Atlassian MCP      | Recently modified pages                 |

## Workflow

1. Parse op from `$ARGUMENTS`
2. Read corresponding `references/<op>.md`
3. Execute steps — collectors live in `${CLAUDE_SKILL_DIR}/collectors/`, templates in `${CLAUDE_SKILL_DIR}/templates/`, dashboard in `${CLAUDE_SKILL_DIR}/dashboard/`

## Prerequisites

```bash
az devops configure --defaults organization=https://dev.azure.com/YOUR_ORG project=YOUR_PROJECT
az login
```

Confluence integration: requires Atlassian MCP server. Skipped silently if absent.

## Output Structure

```
.insights/
├── raw/
│   ├── prs.json           # Azure PRs
│   ├── workitems.json     # Azure work items
│   ├── commits.json       # Local git commits
│   └── confluence.json    # Confluence pages
├── 2025-01-08-insights.md # Daily reports
├── 2025-W02-insights.md   # Weekly reports
└── dashboard.html         # Generated dashboard
```

## Notes

- `collectors/`, `templates/`, `dashboard/` infra unchanged — only the dispatch surface consolidated.
- Monthly review uses `collectors/format-review.mjs --month YYYY-MM` or the `templates/monthly-review.md` template.
