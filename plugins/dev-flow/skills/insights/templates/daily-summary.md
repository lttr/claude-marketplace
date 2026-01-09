# Daily Codebase Insights Prompt

Generate a daily summary of codebase activity.

## Input Data

**Date:** {{DATE}}

### Pull Requests

{{PRS_DATA}}

### Commits

{{COMMITS_DATA}}

### Work Items

{{WORKITEMS_DATA}}

### Confluence (if available)

{{CONFLUENCE_DATA}}

## Task

Create a concise daily codebase activity summary covering:

1. **Pull Requests** - What was opened, merged, or reviewed
2. **Commits** - Key changes by area/author
3. **Work Items** - What started, what completed
4. **Key Changes** - Synthesize the most significant activity

## Output Format

```markdown
## {{DATE}} - Codebase Activity

### Summary

Brief 1-2 sentence overview of the day's activity.

### Pull Requests

- **Opened:** N
- **Merged:** N
- **In Review:** N

Notable PRs:

- #123: Title (author) - brief context

### Commits

- Total: N commits
- Key changes by area

### Work Items

- **Started:** N items moved to Active/In Progress
- **Completed:** N items moved to Done/Closed

### Key Changes

Synthesized summary of the most significant changes and their impact.
```

## Guidelines

- Focus on **what changed** and **why it matters**
- Group related commits into themes
- Highlight cross-cutting changes that affect multiple areas
- Note any blocked or abandoned work
- Keep it scannable - busy developers will skim
