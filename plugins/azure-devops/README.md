# azure-devops

Azure DevOps CLI guidance and codebase insights for managing repos, pipelines, boards, and understanding project activity.

## Installation

```bash
/plugin marketplace add <marketplace-source>
/plugin install azure-devops@<marketplace-name>
```

## Features

### Commands

- **`/azdo:commit-push-pr`** - Commit, push, and create Azure DevOps PR in one command
- **`/azdo:ticket:start`** - Set work item to "Active"
- **`/azdo:ticket:cr`** - Set work item to "Code Review"
- **`/insights:daily [date]`** - Generate daily codebase activity summary
- **`/insights:weekly [date]`** - Generate weekly codebase activity summary

### Skills

- **az-cli** - Practical commands for Azure DevOps CLI
  - List your PRs and work items
  - Run and monitor pipelines
  - Query work items with WIQL
  - Manage repositories and branches

- **codebase-insights** - Generate activity summaries from multiple sources
  - Azure PRs (opened, merged, reviewed)
  - Azure work items (state changes)
  - Local git commits
  - Confluence pages (optional)

## Prerequisites

```bash
# Install Azure CLI with DevOps extension
az extension add --name azure-devops

# Authenticate
az login

# Set defaults
az devops configure --defaults organization=https://dev.azure.com/YOUR_ORG project=YOUR_PROJECT
```

## Skill Contents

### SKILL.md

Most-used commands ready to run:

- List my PRs: `az repos pr list --creator <me>`
- My work items: `az boards query --wiql "...WHERE [System.AssignedTo] = @Me..."`
- Pipeline runs: `az pipelines runs list`
- Create PR, run pipeline, update work items

### References

Detailed command references:

- `repos.md` - Repositories, PRs, policies, branches
- `pipelines.md` - Pipelines, runs, variables, releases
- `boards.md` - Work items, queries, areas, iterations
- `devops.md` - Projects, teams, users, wikis, auth

## Development

See [CLAUDE.md](../../CLAUDE.md) for development guidelines.
