---
name: df:azdo:review
allowed-tools: Bash(az repos pr:*), Bash(az repos show:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git blame:*), Bash(fd:*), Glob, Grep, Read, Task
description: Code review an Azure DevOps pull request (read-only)
argument-hint: <pr-id or pr-url>
---

# Azure DevOps PR Code Review (v2)

Review an Azure DevOps pull request using data-source-based agents. **Read-only** - does not post comments.

**Arguments (`$ARGUMENTS`):** PR ID (e.g., `12345`) or PR URL

## Workflow

### 1. Fetch PR Details

```bash
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

### 4. Check Diff Size

Count changed files. If >50 files, warn user: "Large diff (X files). Proceed with full review or filter to specific paths?"

### 5. Save Diff to Temp File

Save diff to `/tmp/review-diff-<pr-id>.diff`. Skill expects diff file path.

### 6. Get Changed Files

Parse diff to extract list of changed files.

### 7. Check for Rule Files

```bash
fd CLAUDE.md --type f
fd . .claude/rules --type f 2>/dev/null
```

If neither exist, abort: "No rule files found. Create CLAUDE.md or .claude/rules/ to enable code review."

### 8. Invoke Code Review Skill

Pass to `df:code-review` skill:

- Diff file path from step 5
- Changed files list from step 6
- PR metadata: title, description, author

The skill handles:

- **Phase 1:** Context gathering (rule paths, tech stack, change summary)
- **Phase 2:** 5 parallel review agents (rules, bugs, dependencies, history, comments)
- **Phase 3:** Per-issue scoring with separate Haiku agents
- **Phase 4:** Filter (≥75) and format output

## Output

```markdown
## PR Review: #<pr-id> - <title>

**Author:** <author> | **Target:** <target-branch> | **Status:** <status>

**Files changed:** X | **Issues found:** X critical, X important

### Critical Issues (score ≥90)
...

### Important Issues (score 75-89)
...

### Minor Notes (informational)
...

### Summary
- **Recommendation:** approve | request-changes | needs-discussion
- **Risk areas:** ...
```

## Notes

- Uses `az repos pr` commands (requires azure-devops CLI extension)
- Does NOT post comments - output is for your review only
- To post feedback: `az repos pr create-comment --id <pr-id> --content "..."`
- For local branch review, use `/df:review` instead
