---
allowed-tools: Bash(mkdir:*), Write, Read, Glob, Grep, Task, AskUserQuestion
description: Triage manually pasted requirements or specifications
argument-hint: [short-title]
---

## Task

Triage the requirements provided in this conversation. The user will paste or describe the functionality to analyze.

## Steps

### 1. Receive Input

Wait for the user to paste or describe:

- Feature requirements
- Issue description
- Acceptance criteria
- Bug report
- Any specification text

If $ARGUMENTS contains a short title, use it. Otherwise, derive a title from the input.

### 2. Run Triage Analysis

Apply the triage methodology from SKILL.md:

- Explore local codebase for technical context (use Explore agent)
- Search local project docs (`docs/`, `README.md`, ADRs)
- Assess completeness across all dimensions
- Generate prioritized questions

No external ticket system or documentation system - analyze against local codebase only.

### 3. Ask Questions Interactively

**Use `AskUserQuestion` tool** to ask blockers and scope questions the user might know. Only unanswered questions go to the output file.

### 4. Write Output

```bash
mkdir -p ./.aitools/triage
```

Save to `./.aitools/triage/<slugified-title>.md`

Slugify: lowercase, spaces→hyphens, remove special chars, max 50 chars.

### 5. Summary

Output:

- File path where triage was saved
- Completeness rating
- Count of blocker questions (if any)
