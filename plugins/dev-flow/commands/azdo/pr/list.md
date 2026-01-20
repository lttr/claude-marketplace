---
name: df:azdo:pr:list
allowed-tools: Bash(az repos pr:*), Bash(az devops invoke:*), Bash(git remote:*), Bash(git config:*)
description: List Azure DevOps PRs (mine by default, or all with "all" argument)
argument-hint: [all]
---

## Context

- User email: extTrumm@dr-max.global

## Task

List active pull requests from current Azure DevOps repository.

**Arguments (`$ARGUMENTS`):**

- _(empty)_ → show PRs created by me OR where I'm a reviewer
- `all` → show all active PRs

**Workflow:**

1. **Detect repo**: Get repository name from `git remote -v` (extract from Azure DevOps URL)
2. **List PRs**:
   - If `all`: `az repos pr list --status active --repository <repo> --output table`
   - Otherwise: Run two queries and combine:
     - `az repos pr list --status active --repository <repo> --creator extTrumm@dr-max.global --output json`
     - `az repos pr list --status active --repository <repo> --reviewer extTrumm@dr-max.global --output json`
3. **For PRs created by me**: Check unresolved comments using:
   ```bash
   az devops invoke --area git --resource pullRequestThreads \
     --route-parameters project=ecommerce-operations repositoryId=<repo> pullRequestId=<id> \
     --query 'value[?status==`active`] | length(@)' -o tsv
   ```
4. **Display**: Show results with unresolved comment count for my PRs

**Output format:**

For personal view:

```
**Created by me:**
| ID | Title | Unresolved |
|----|-------|------------|
| 123 | feat: ... | 2 comments |

**Reviewing:**
| ID | Title | Creator |
|----|-------|---------|
```
