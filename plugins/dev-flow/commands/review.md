---
name: df:review
description: Code review current branch against base (master/main)
argument-hint: "[base-branch]"
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git blame:*), Bash(git rev-parse:*), Bash(fd:*), Glob, Grep, Read, Task
---

# Local Branch Code Review

Review changes in current branch against base branch.

**Arguments (`$ARGUMENTS`):** Base branch name (optional, defaults to `master` or `main`)

## Context

- Current branch: !`git branch --show-current`
- Base branch: !`git rev-parse --verify master 2>/dev/null && echo master || echo main`

## Workflow

### 1. Determine Base Branch

If `$ARGUMENTS` provided, use that. Otherwise:

```bash
# Check if master exists, fallback to main
git rev-parse --verify master 2>/dev/null && echo master || echo main
```

### 2. Validate Branch State

```bash
# Ensure we're not on the base branch
git branch --show-current
```

If on base branch, inform user: "You're on the base branch. Switch to a feature branch first."

### 3. Get Changed Files

```bash
git diff --name-only <base>...HEAD
```

### 4. Get Full Diff

```bash
git diff <base>...HEAD
```

### 5. Invoke Code Review Skill

Pass to `df:code-review` skill:
- Diff content from step 4
- Changed files list from step 3
- Branch name as title

The skill handles:
- Context gathering (CLAUDE.md, tech stack, linter configs)
- Parallel review agents
- Issue scoring
- Output formatting

## Output

Skill outputs review in standard format. See `df:code-review` skill for details.
