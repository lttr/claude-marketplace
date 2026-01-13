---
name: df:azdo:branch
allowed-tools: Bash(git branch:*), Bash(git checkout:*), Bash(git status:*)
description: Create a feature branch from ticket context or arguments
argument-hint: [ticket-id] [description]
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`

## Task

Create a feature branch following the naming convention.

**Branch format:** `feature/<ticket_number>-<description>`

Example: `feature/12345-add-user-auth`

**Arguments (`$ARGUMENTS`):**

- If provided: `<ticket-id> [description]` → use directly
- If empty: extract from conversation context (e.g., prior `/df:azdo:triage` output)

**Workflow:**

1. **Get ticket info:**
   - From `$ARGUMENTS`: first arg = ticket ID, rest = description
   - From context: look for Azure DevOps work item number and title from triage
   - If neither available: ask user for ticket ID

2. **Format description:**
   - Lowercase, hyphen-separated
   - Keep concise (3-5 words max)
   - Strip special characters

3. **Create branch:**

   ```bash
   git checkout -b feature/<ticket_id>-<description>
   ```

4. **Confirm:** Show created branch name
