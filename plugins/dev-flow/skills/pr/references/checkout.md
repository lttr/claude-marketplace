# pr checkout

Check out the source branch of an Azure DevOps PR.

## Input

`$ARGUMENTS` after `checkout` = PR id (numeric) or PR URL. Extract id from URL if needed.

## Workflow

1. **Pre-flight:** if `git status --short` shows uncommitted changes, warn — ask stash/abort.
2. **Get PR details:**
   ```bash
   az repos pr show --id <id> --query '{sourceBranch: sourceRefName, title: title}' -o json
   ```
3. **Strip prefix:** `refs/heads/<branch>` → `<branch>`
4. **Fetch + checkout:**
   ```bash
   git fetch origin <branch>
   git checkout <branch>
   ```
5. **Report:** branch name + PR title.

## Errors

- PR not found → report id
- Local changes would be overwritten → already caught in pre-flight
