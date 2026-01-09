# Weekly Codebase Insights Prompt

Generate a comprehensive weekly summary of codebase activity.

## Input Data

**Week:** {{WEEK_START}} to {{WEEK_END}} ({{ISO_WEEK}})

### Pull Requests
{{PRS_DATA}}

### Commits
{{COMMITS_DATA}}

### Work Items
{{WORKITEMS_DATA}}

### Confluence (if available)
{{CONFLUENCE_DATA}}

## Task

Create a weekly codebase activity summary covering:

1. **Overview** - High-level summary of the week
2. **PR Activity** - PRs opened, merged, review patterns
3. **Commit Themes** - Patterns in what was worked on
4. **Work Items** - Sprint progress, completions, blockers
5. **Contributors** - Who worked on what
6. **Highlights** - Notable achievements or changes

## Output Format

```markdown
## Week of {{WEEK_START}} ({{ISO_WEEK}})

### Overview
2-3 sentence summary of the week's focus and outcomes.

### Pull Requests
**Summary:** X opened, Y merged, Z in review

| PR | Title | Author | Status | Notes |
|----|-------|--------|--------|-------|
| #123 | Feature X | @user | Merged | Key context |

**Review Activity:**
- Average time to merge: X days
- PRs waiting for review: N

### Commit Activity
**Total:** N commits from M contributors

**By Area:**
- Feature A: X commits - brief description
- Bug fixes: Y commits - brief description
- Infrastructure: Z commits - brief description

**By Contributor:**
- @user1: N commits (areas...)
- @user2: N commits (areas...)

### Work Items
**Sprint Progress:**
- Started: N items
- Completed: N items
- Blocked: N items

**Completed Items:**
- #456: Work item title
- #789: Work item title

**In Progress:**
- #012: Work item title (assignee)

### Themes & Patterns
- **Primary focus:** What the team mainly worked on
- **Cross-cutting:** Changes spanning multiple areas
- **Technical debt:** Any refactoring or cleanup work

### Highlights
1. Notable achievement or milestone
2. Important change with context
3. Key decision or direction

### Looking Ahead
- Items rolling into next week
- Potential blockers
- Dependencies to watch
```

## Guidelines

- Identify **patterns** across individual commits and PRs
- Connect work items to actual code changes
- Highlight **velocity** (how much got done) and **direction** (where things are heading)
- Note any **blockers** or concerning patterns
- Make it useful for standup, sprint review, or stakeholder updates
- Be factual - only report what the data shows
