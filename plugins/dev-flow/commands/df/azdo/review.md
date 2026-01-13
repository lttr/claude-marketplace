---
name: df:azdo:review
allowed-tools: Bash(az repos pr:*), Bash(az repos show:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git blame:*), Glob, Grep, Read, Task
description: Code review an Azure DevOps pull request (read-only)
argument-hint: <pr-id or pr-url>
---

# Azure DevOps PR Code Review

Review an Azure DevOps pull request and provide feedback. **Read-only by default** - does not post comments.

**Arguments (`$ARGUMENTS`):** PR ID (e.g., `12345`) or PR URL

## Workflow

1. **Fetch PR details:**

   ```bash
   # If URL provided, extract PR ID from it
   az repos pr show --id <pr-id> --output json
   ```

2. **Check eligibility** (use Haiku agent):
   - Skip if: closed, draft, automated PR, or trivially simple
   - If ineligible, explain why and stop

3. **Gather context:**
   - Get list of changed files from PR
   - Find relevant CLAUDE.md files (root + directories with changes)
   - Get PR description and linked work items

4. **Fetch PR diff:**

   ```bash
   az repos pr diff --id <pr-id>
   ```

5. **Launch parallel review agents** (Sonnet):

   a. **CLAUDE.md compliance** - Check changes against project guidelines
   b. **Bug scan** - Shallow scan for obvious bugs in changed lines
   c. **Git history context** - Check blame/history for relevant patterns
   d. **Code comment compliance** - Verify changes follow inline guidance

6. **Score issues** (parallel Haiku agents):
   - 0-25: False positive / pre-existing
   - 50: Minor / nitpick
   - 75: Real issue, important
   - 100: Critical, will break things

7. **Filter and report:**
   - Only include issues scored ≥75
   - Group by severity

## Output Format

```markdown
## PR Review: #<pr-id> - <title>

**Status:** <status> | **Author:** <author> | **Target:** <target-branch>

### Critical Issues

- [file:line] Description (reason: <CLAUDE.md|bug|history>)

### Important Issues

- [file:line] Description (reason)

### Summary

- Files reviewed: X
- Issues found: X critical, X important
- Recommendation: <approve|request-changes|needs-discussion>
```

## False Positives to Ignore

- Pre-existing issues (not introduced by this PR)
- Issues a linter/compiler would catch
- Pedantic style nitpicks
- Changes on lines not modified in PR
- Intentional functionality changes related to PR purpose

## Notes

- Uses `az repos pr` commands (requires azure-devops CLI extension)
- Does NOT post comments - output is for your review only
- To post feedback, copy relevant parts and use `az repos pr create-comment`
- For GitHub PRs, use `/code-review` instead
