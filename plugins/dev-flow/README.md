# dev-flow

Developer workflow automation: triage requirements, generate activity insights, and manage git workflows with Azure DevOps and Confluence integration.

## Structure

```
dev-flow/
├── skills/
│   ├── triage/           # Generic - requirement analysis methodology
│   ├── spec/             # Generic - implementation spec from triage
│   ├── insights/         # Hybrid - activity summary generation
│   │   ├── templates/    # Report templates (daily, weekly)
│   │   ├── collectors/   # Runtime scripts for data collection
│   │   │   ├── azure-prs.js      # Azure-specific
│   │   │   ├── azure-workitems.js # Azure-specific
│   │   │   ├── git-commits.js    # Generic (local git)
│   │   │   ├── filter-by-date.js # Generic utility
│   │   │   └── format-summary.js # Generic utility
│   │   └── dashboard/    # Interactive visualization
│   │       ├── generate.ts       # Deno dashboard generator
│   │       └── template.html     # Dashboard HTML template
│   └── sources/
│       └── az-cli/       # Azure-specific - CLI command reference
│           └── references/
│
└── commands/df/          # /df:* namespace
    ├── triage.md         # Generic - manual input triage
    ├── insights/         # Generic - activity reports
    │   ├── daily.md
    │   └── weekly.md
    └── azdo/             # Azure-specific
        ├── pr/
        │   ├── create.md # Commit + push + PR workflow
        │   └── complete.md # Complete (merge) PR
        ├── triage.md     # Azure ticket triage
        └── ticket/
            ├── start.md  # Set work item to Active
            └── cr.md     # Set work item to Code Review
```

## Generic vs Specific

| Component                                   | Scope          | Data Sources                        |
| ------------------------------------------- | -------------- | ----------------------------------- |
| `skills/triage/`                            | Generic        | Local codebase only                 |
| `skills/spec/`                              | Generic        | Triage output + codebase            |
| `skills/insights/`                          | Hybrid         | Azure + Git + Confluence (optional) |
| `skills/sources/az-cli/`                    | Azure-specific | Azure DevOps CLI                    |
| `skills/insights/collectors/git-commits.js` | Generic        | Local git                           |
| `skills/insights/collectors/azure-*.js`     | Azure-specific | Azure DevOps API                    |
| `/df:triage`                                | Generic        | Local codebase                      |
| `/df:insights:*`                            | Hybrid         | Azure + Git + Confluence (optional) |
| `/df:azdo:*`                                | Azure-specific | Azure DevOps + Confluence           |

## Commands

### Generic

| Command                             | Description                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `/df:commit [message] [push] [all]` | Commit with commitlint format (`type(ticket#): msg`) |
| `/df:review [base-branch]`          | Code review current branch (v2, data-source agents)  |
| `/df:spec [triage-file]`            | Generate implementation spec from triage output      |
| `/df:triage [title]`                | Triage pasted requirements against local codebase    |
| `/df:insights:daily [date]`         | Daily activity summary                               |
| `/df:insights:weekly [date]`        | Weekly activity summary                              |
| `/df:insights:view [--serve]`       | Interactive dashboard (static HTML or dev server)    |
| `/df:insights:catchup`              | Download raw insights data since last collection     |

### Azure DevOps

| Command                                          | Description                                 |
| ------------------------------------------------ | ------------------------------------------- |
| `/df:azdo:pr:create [message]`                   | Commit, push, create Azure DevOps PR        |
| `/df:azdo:pr:complete [--transition-work-items]` | Complete (merge) PR for current branch      |
| `/df:azdo:pr:list [all]`                         | List active PRs (mine by default, or all)   |
| `/df:azdo:pr:checkout <pr-id>`                   | Checkout PR branch locally                  |
| `/df:azdo:branch [id] [desc]`                    | Create feature branch from ticket           |
| `/df:azdo:review <pr-id>`                        | Code review Azure DevOps PR                 |
| `/df:azdo:triage <ticket-id>`                    | Triage Azure ticket with Confluence context |
| `/df:azdo:ticket:start <id>`                     | Set work item to Active                     |
| `/df:azdo:ticket:cr <id>`                        | Set work item to Code Review                |

## Data Sources

- **Local Git** - Commits from current repository
- **Azure DevOps** - PRs, work items, pipelines (via `az` CLI)
- **Confluence** - Documentation search (via Atlassian MCP, optional)

## Dependencies

- Azure CLI with `azure-devops` extension (for Azure commands)
- Atlassian MCP server (for Confluence integration, optional)
- Deno runtime (for `/df:insights:view` dashboard)

## .aiwork/ Output

Dev-flow saves artifacts to `.aiwork/` directories:

| Folder             | Content              |
| ------------------ | -------------------- |
| `.aiwork/triage/`  | Requirement analysis |
| `.aiwork/specs/`   | Implementation specs |
| `.aiwork/reviews/` | Code review reports  |

**Works without configuration** - directories created automatically.

**For full conventions** (naming, frontmatter, cross-references), install [aiwork-folder-protocol](../aiwork-folder-protocol). Without it, files are saved but naming/organization guidance is missing.
