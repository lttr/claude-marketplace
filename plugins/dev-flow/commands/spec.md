---
name: df:spec
allowed-tools: Bash(mkdir:*), Write, Read, Glob, Grep, Task, AskUserQuestion
description: Generate implementation spec from triage output
argument-hint: [triage-file-or-ticket-id]
---

## Task

Generate an implementation specification from triage output. The user provides a triage file path or ticket ID.

## Steps

### 1. Receive Input

Expect one of:

- **Triage file path** - e.g., `.aiwork/triage/auth-refactor.md`
- **Ticket ID** - Locate triage at `.aiwork/triage/*<ticket-id>*.md`
- **No argument** - Ask user to specify or list recent triage files

If `$ARGUMENTS` provided, use it. Otherwise, prompt user.

### 2. Run Spec Generation

Apply the spec methodology from `skills/spec/SKILL.md`:

- Extract ticket metadata, scope, dependencies from triage
- Ask clarifying questions via `AskUserQuestion`
- Explore technical details if needed (use Explore agent)
- Generate spec using template from `skills/spec/assets/spec-template.md`

### 3. Write Output

```bash
mkdir -p ./.aiwork/specs
```

Save to `./.aiwork/specs/<ticket-id>-<slugified-title>.md`

### 4. Summary

Output:

- File path where spec was saved
- Count of decisions made
- Count of open questions remaining (if any)
