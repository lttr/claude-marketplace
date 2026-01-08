# triage

Triage issues and specifications for completeness, gathering context from Azure DevOps, Confluence, and local codebase.

## Installation

```bash
/plugin marketplace add <marketplace-source>
/plugin install triage@<marketplace-name>
```

## Features

### Skill: `triage`

Analyzes requirements, issues, or specifications for completeness:

- Explores codebase for technical context
- Searches documentation for implicit requirements
- Assesses completeness across 10 dimensions
- Generates prioritized clarifying questions

**Triggers:** "triage", "review this spec", "is this requirement complete", "what questions should I ask"

### Command: `/triage:manual [title]`

Triage manually pasted requirements against the local codebase:

```bash
/triage:manual auth-refactor
# Then paste your requirements/description
```

- No external integrations - analyzes against local codebase only
- Writes report to configured output path

### Command: `/triage:azdo <ticket-id>`

Triage an Azure DevOps work item with full context gathering:

1. Fetches ticket from Azure DevOps (title, description, acceptance criteria, relations)
2. Searches Confluence for related documentation (via Atlassian MCP)
3. Explores local codebase for technical context
4. Runs completeness analysis
5. Writes report to configured output path

**Usage:**

```bash
/triage:azdo 12345
/triage:azdo 12345 authentication sso  # with additional Confluence search terms
```

## Hardcoded Settings

To customize, edit the plugin files directly:

| Setting       | Value                      | Location                           |
| ------------- | -------------------------- | ---------------------------------- |
| Output path   | `~/.aitools/triage/`       | `skills/triage/SKILL.md`, commands |
| Ticket system | Azure DevOps               | `commands/triage/azdo.md`          |
| Doc system    | Confluence (Atlassian MCP) | `.mcp.json`                        |

## Dependencies

- Azure CLI with `azure-devops` extension (for `/triage:azdo`)
- Atlassian MCP server (for Confluence search)
- `azure-devops:az-cli` skill (from azure-devops plugin)

## Output

Reports are saved with the format:

```markdown
# Triage: [Title]

**Source**: [Ticket ID or "Manual input"]
**Date**: [YYYY-MM-DD]
**Completeness**: [Ready | Mostly Ready | Needs Clarification | Underspecified]

## Summary

## What's Clear

## Implicit Requirements (from docs)

## Gaps Identified

## Questions (Blockers → Scope → Technical → Nice to Know)
```
