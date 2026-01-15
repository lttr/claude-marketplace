---
name: df:azdo:review
allowed-tools: Bash(az repos pr:*), Bash(az repos show:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git blame:*), Bash(fd:*), Glob, Grep, Read, Task
description: Code review an Azure DevOps pull request (read-only)
argument-hint: <pr-id or pr-url>
---

# Azure DevOps PR Code Review

Review an Azure DevOps pull request. **Read-only** - does not post comments.

**Arguments (`$ARGUMENTS`):** PR ID (e.g., `12345`) or PR URL

## Workflow

### 1. Fetch PR Details

```bash
# If URL provided, extract PR ID from it
az repos pr show --id <pr-id> --output json
```

Extract: `pullRequestId`, `title`, `description`, `status`, `createdBy.displayName`, `targetRefName`

### 2. Check Eligibility

Use Haiku agent to check - skip if:

- Status is `completed` or `abandoned`
- Title contains `[WIP]` or `[Draft]`
- Author is a bot/automation account
- Only auto-generated files changed (lockfiles, etc.)

If ineligible, explain why and stop.

### 3. Fetch PR Diff

```bash
az repos pr diff --id <pr-id>
```

### 4. Get Changed Files

Parse diff to extract list of changed files.

### 5. Invoke Code Review Skill

Pass to `df:code-review` skill:

- Diff content from step 3
- Changed files list from step 4
- PR metadata: title, description, author

The skill handles all review logic:

- Context gathering (CLAUDE.md, tech stack)
- Parallel review agents
- Issue scoring and filtering
- Output formatting

## Output

Skill outputs review with PR metadata header:

```markdown
## PR Review: #<pr-id> - <title>

**Author:** <author> | **Target:** <target-branch> | **Status:** <status>

[... skill output ...]
```

## Notes

- Uses `az repos pr` commands (requires azure-devops CLI extension)
- Does NOT post comments - output is for your review only
- To post feedback: `az repos pr create-comment --id <pr-id> --content "..."`
- For local branch review, use `/df:review` instead
