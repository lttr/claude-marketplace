---
name: df:azdo:pr:complete
allowed-tools: Bash(git branch:*), Bash(az repos pr:*)
description: Complete (merge) the Azure DevOps PR for current branch
argument-hint: [--transition-work-items]
---

## Context

- Current branch: !`git branch --show-current`

## Task

Complete the Azure DevOps pull request associated with the current branch.

**Arguments (`$ARGUMENTS`):**

- `--transition-work-items` or `-t` → set `--transition-work-items true` (default: false)

**Workflow:**

1. **Get PR ID**: Find the PR for current branch:
   ```bash
   az repos pr list --source-branch "$(git branch --show-current)" --status active --query "[0].pullRequestId" -o tsv
   ```
2. **Validate**: If no active PR found, report error and stop
3. **Complete PR**:
   ```bash
   az repos pr update \
     --id <pr_id> \
     --status completed \
     --delete-source-branch true \
     --transition-work-items <true|false>
   ```
4. **Report**: Show completion status and any relevant details

**Notes:**

- Merge strategy is determined by Azure DevOps repository policy
- Source branch is always deleted after merge
- Work items are NOT transitioned by default (use `--transition-work-items` to enable)
