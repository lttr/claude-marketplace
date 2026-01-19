---
name: df:azdo:pr:checkout
allowed-tools: Bash(git fetch:*), Bash(git checkout:*), Bash(git branch:*), Bash(git status:*), Bash(az repos pr:*)
description: Check out an Azure DevOps PR's source branch locally
argument-hint: <pr-number>
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`

## Task

Check out the source branch of an Azure DevOps pull request.

**Arguments (`$ARGUMENTS`):**

- PR number (e.g., `123`) → fetch and checkout that PR's source branch
- PR URL → extract PR number and checkout

**Workflow:**

1. **Get PR details**: `az repos pr show --id <pr-number> --query '{sourceBranch: sourceRefName, title: title}' -o json`
2. **Extract branch**: Strip `refs/heads/` prefix from sourceBranch
3. **Fetch**: `git fetch origin <branch>`
4. **Checkout**: `git checkout <branch>`
5. **Report**: Confirm branch checked out, show PR title

**Error handling:**

- If PR not found → report error with PR number
- If local changes would be overwritten → warn user to stash or commit first
