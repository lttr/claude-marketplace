---
name: codebase-insights
description: Generate daily and weekly codebase activity summaries from Azure DevOps (PRs, work items), local git commits, and optionally Confluence. Use when asked about "what happened", "codebase activity", "team summary", "pr summary", or to understand what's going on in a large codebase.
---

# Codebase Insights Skill

Generate activity summaries revealing what's happening in a codebase day-to-day and week-to-week.

## Data Sources

| Source           | Tool                 | Data                                    |
| ---------------- | -------------------- | --------------------------------------- |
| Azure PRs        | `az repos pr list`   | PRs opened, merged, reviewed            |
| Azure Work Items | `az boards query`    | Tickets started, completed, in progress |
| Local Git        | `git log`            | Commits in current repo                 |
| Confluence       | MCP tools (optional) | Related documentation changes           |

## Workflow

### 1. Collect Data

Run collectors from the current repository directory:

```bash
SKILL_DIR="$PLUGIN_DIR/skills/codebase-insights"

# Azure PRs (last N days)
node $SKILL_DIR/collectors/azure-prs.js --days 7

# Azure work items (last N days)
node $SKILL_DIR/collectors/azure-workitems.js --days 7

# Local git commits (last N days)
node $SKILL_DIR/collectors/git-commits.js --days 7
```

Data saved to `.insights/raw/`.

### 2. Filter by Period

```bash
# For daily summary
node $SKILL_DIR/collectors/filter-by-date.js .insights/raw/commits.json --day 2025-01-08

# For weekly summary
node $SKILL_DIR/collectors/filter-by-date.js .insights/raw/commits.json --week 2025-01-08
```

### 3. Generate Summary

Use templates from `$SKILL_DIR/templates/`:

- `daily-summary.md` - Daily activity report
- `weekly-summary.md` - Weekly activity report

### 4. Save Output

Reports saved to `.insights/`:

- Daily: `.insights/YYYY-MM-DD-insights.md`
- Weekly: `.insights/YYYY-WXX-insights.md`

## Commands

| Command                   | Description                      |
| ------------------------- | -------------------------------- |
| `/insights:daily [date]`  | Generate daily codebase summary  |
| `/insights:weekly [date]` | Generate weekly codebase summary |

## Usage Examples

- "What happened in the codebase today?"
- "Summarize this week's activity"
- "Show me PR activity for the last 7 days"
- "What work items were completed this week?"

## Prerequisites

```bash
# Azure DevOps CLI configured
az devops configure --defaults organization=https://dev.azure.com/YOUR_ORG project=YOUR_PROJECT

# Authenticated
az login
```

## Confluence Integration

If Atlassian MCP tools are available, the skill will also search for:

- Recently modified pages in project-related spaces
- Documentation changes correlating with code changes

Confluence is **optional** - the skill works without it.

## Output Structure

```
.insights/
├── raw/
│   ├── prs.json           # Azure PRs
│   ├── workitems.json     # Azure work items
│   └── commits.json       # Local git commits
├── 2025-01-08-insights.md # Daily reports
└── 2025-W02-insights.md   # Weekly reports
```

## Report Sections

### Daily Summary

- **Pull Requests**: Opened, merged, reviewed today
- **Commits**: By author, by area
- **Work Items**: State changes (started, completed)
- **Key Changes**: AI-synthesized summary

### Weekly Summary

- **Overview**: High-level activity summary
- **PR Activity**: Week's PRs with outcomes
- **Commit Themes**: Patterns and focus areas
- **Work Items**: Sprint progress, completions
- **Contributors**: Who worked on what
- **Highlights**: Notable achievements
