# dev-flow

Developer workflow automation: triage requirements, generate activity insights, and manage git workflows with Azure DevOps and Confluence integration.

## Structure

```
dev-flow/
├── skills/
│   ├── triage/           # Generic - requirement analysis methodology
│   ├── insights/         # Generic - activity summary generation
│   │   └── templates/    # Report templates (daily, weekly)
│   └── sources/
│       └── az-cli/       # Azure-specific - CLI command reference
│           └── references/
│
├── collectors/           # Runtime scripts for data collection
│   ├── azure-prs.js      # Azure-specific
│   ├── azure-workitems.js # Azure-specific
│   ├── git-commits.js    # Generic (local git)
│   ├── filter-by-date.js # Generic utility
│   └── format-summary.js # Generic utility
│
└── commands/df/          # /df:* namespace
    ├── triage.md         # Generic - manual input triage
    ├── insights/         # Generic - activity reports
    │   ├── daily.md
    │   └── weekly.md
    └── azdo/             # Azure-specific
        ├── pr.md         # Commit + push + PR workflow
        ├── triage.md     # Azure ticket triage
        └── ticket/
            ├── start.md  # Set work item to Active
            └── cr.md     # Set work item to Code Review
```

## Generic vs Specific

| Component | Scope | Data Sources |
|-----------|-------|--------------|
| `skills/triage/` | Generic | Local codebase only |
| `skills/insights/` | Generic | Template-based, source-agnostic |
| `skills/sources/az-cli/` | Azure-specific | Azure DevOps CLI |
| `collectors/git-commits.js` | Generic | Local git |
| `collectors/azure-*.js` | Azure-specific | Azure DevOps API |
| `/df:triage` | Generic | Local codebase |
| `/df:insights:*` | Hybrid | Azure + Git + Confluence (optional) |
| `/df:azdo:*` | Azure-specific | Azure DevOps + Confluence |

## Commands

### Generic

| Command | Description |
|---------|-------------|
| `/df:triage [title]` | Triage pasted requirements against local codebase |
| `/df:insights:daily [date]` | Daily activity summary |
| `/df:insights:weekly [date]` | Weekly activity summary |

### Azure DevOps

| Command | Description |
|---------|-------------|
| `/df:azdo:pr [message]` | Commit, push, create Azure DevOps PR |
| `/df:azdo:triage <ticket-id>` | Triage Azure ticket with Confluence context |
| `/df:azdo:ticket:start <id>` | Set work item to Active |
| `/df:azdo:ticket:cr <id>` | Set work item to Code Review |

## Data Sources

- **Local Git** - Commits from current repository
- **Azure DevOps** - PRs, work items, pipelines (via `az` CLI)
- **Confluence** - Documentation search (via Atlassian MCP, optional)

## Dependencies

- Azure CLI with `azure-devops` extension (for Azure commands)
- Atlassian MCP server (for Confluence integration, optional)
