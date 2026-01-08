---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Bash(git show:*), Bash(git rev-parse:*), Bash(git push:*), Bash(git branch:*), Bash(git checkout:*), Bash(az repos pr:*)
description: Commit changes, push branch, and create Azure DevOps PR in one workflow
argument-hint: [commit message]
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`
- Current diff: !`git diff HEAD`

## Task

Commit, push, and create an Azure DevOps pull request in a single workflow.

**Arguments (`$ARGUMENTS`):**

- Text → use as commit message guidance (also informs PR title)
- Ticket number (e.g., `12345`) → used for branch naming

**Pre-staged files:**

Check `git diff --cached --name-only`. If any staged files weren't modified by Claude, warn user and ask: (a) include them, (b) unstage them, or (c) abort.

**Workflow:**

1. **Branch check**: If on main/master, create a feature branch:
   - Format: `feature/<ticket_number>-<optional-description>`
   - Get ticket number from: `$ARGUMENTS`, conversation context (Azure DevOps work item), or ask user
   - Example: `feature/12345-add-user-auth`
2. **Identify files**: Find Claude-modified files from conversation
3. **Stage & commit**: Use `git add <files>` then commit with meaningful message
4. **Push**: `git push -u origin <branch>` (set upstream)
5. **Create PR**: Use Azure DevOps CLI:
   ```bash
   az repos pr create \
     --source-branch <current-branch> \
     --target-branch main \
     --title "<PR title>" \
     --description "<PR description with summary of changes>" \
     --work-items <ticket_number>  # if ticket number is known
   ```
6. **Report**: Show PR URL and summary

**PR Description:** Brief summary of changes (1-3 bullet points). Include test plan only if known.

Execute git commands in parallel where possible. Complete all steps in a single response.
