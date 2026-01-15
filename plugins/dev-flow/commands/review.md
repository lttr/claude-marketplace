---
name: df:review
description: Code review current branch against base (master/main)
argument-hint: "[base-branch]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git blame:*), Bash(git rev-parse:*), Bash(fd:*), Glob, Grep, Read, Task
---

# Local Branch Code Review (v2)

Review changes in current branch against base branch using data-source-based agents.

**Arguments (`$ARGUMENTS`):** Base branch name (optional, defaults to `master` or `main`)

## Context

- Current branch: !`git branch --show-current`
- Base branch: !`git rev-parse --verify master 2>/dev/null && echo master || echo main`

## Workflow

### 1. Determine Base Branch

If `$ARGUMENTS` provided, use that. Otherwise detect master/main.

### 2. Validate Branch State

```bash
git branch --show-current
```

If on base branch: "You're on the base branch. Switch to a feature branch first."

### 3. Check Diff Size

```bash
git diff --name-only <base>...HEAD | wc -l
```

If >50 files, warn user: "Large diff (X files). Proceed with full review or filter to specific paths?"

### 4. Get Changed Files

```bash
git diff --name-only <base>...HEAD
```

### 5. Save Diff to Temp File

```bash
git diff <base>...HEAD > /tmp/review-diff-$(date +%s).diff
```

Skill expects diff file path, not inline content.

### 6. Invoke Code Review Skill

Invoke `df:code-review` skill with:

- Diff file path from step 5
- Changed files list from step 4
- Branch name as title
