---
allowed-tools: Bash(az boards:*), Bash(az account:*), Bash(mkdir:*), Write, Read, Glob, Grep, Task, Skill, AskUserQuestion, mcp__atlassian__*
description: Triage an Azure DevOps work item with Confluence context
argument-hint: <ticket-id> [confluence-search-terms]
---

## Task

Triage Azure DevOps work item #$ARGUMENTS by gathering context and generating clarifying questions.

## Steps

### 1. Load Azure DevOps Skill

Invoke the `azure-devops:az-cli` skill to get proper CLI reference for Azure Boards commands.

### 2. Fetch Ticket from Azure DevOps

```bash
az boards work-item show --id <ticket-id> --expand all -o json
```

Extract per config.md field mappings:

- Title
- Description
- Acceptance criteria
- State, Type, Assigned To
- Area Path, Iteration Path
- Relations (parent/child links)

If description or acceptance criteria are HTML, extract readable text.

### 3. Fetch Related Documentation from Confluence

**Always search Confluence** for related documentation—tickets often assume knowledge documented elsewhere.

Use Atlassian MCP tools with multiple searches:

- Search by ticket title keywords
- Search by area path / feature name
- Search by domain terms from description
- If additional search terms provided in arguments, use those

Look for:

- Technical specs
- Architecture documents
- Related feature documentation
- Business requirements
- Existing decisions or constraints

### 4. Run Triage Analysis

With all gathered context (ticket + Confluence + codebase), apply the triage methodology from SKILL.md:

- Explore local codebase for technical context (use Explore agent)
- Search local project docs (`docs/`, `README.md`, ADRs)
- Assess completeness across all dimensions
- Generate prioritized questions

### 5. Ask Questions Interactively

**Use `AskUserQuestion` tool** to ask blockers and scope questions the user might know. Only unanswered questions go to the output file.

### 6. Write Output

```bash
mkdir -p ./.aitools/triage
```

Save to `./.aitools/triage/<ticket-id>-<slugified-title>.md`

Slugify: lowercase, spaces→hyphens, remove special chars, max 50 chars.

### 7. Summary

Output:

- File path where triage was saved
- Completeness rating
- Count of blocker questions (if any)
