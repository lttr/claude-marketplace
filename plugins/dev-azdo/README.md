# dev-azdo

Azure DevOps workflow automation. Single primitive: skills. Each is invokable as `/dev-azdo:<skill>` with natural-language args — no rigid flags.

## Skills

| Skill             | Invoke                            | Purpose                                                                |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `feature-branch`  | `/dev-azdo:feature-branch <tkt>`  | `feature/<id>-<slug>` from ticket title, optional ticket Active toggle |
| `pr`              | `/dev-azdo:pr <op>`               | `create` / `checkout <id>` / `list [mine\|all]` / `complete`           |
| `pr-comments`     | `/dev-azdo:pr-comments [id]`      | Read, assess, post AZDO PR thread comments                             |
| `ticket`          | `/dev-azdo:ticket <id> <state>`   | Transition AZDO work item (state synonyms: active/cr/ready/closed)     |
| `ticket-create`   | `/dev-azdo:ticket-create <title>` | Create a work item with a Markdown description, parent, tags           |
| `ticket-comments` | `/dev-azdo:ticket-comments <id>`  | Add / update / delete Markdown comments on a work item discussion      |
| `insights`        | `/dev-azdo:insights <op>`         | `daily` / `weekly` / `catchup` / `view` activity reports               |
| `az-cli`          | (model-invoked)                   | NL-driven Azure DevOps CLI reference                                   |

## Multi-op Skills

`pr` and `insights` dispatch on the first arg, then load `references/<op>.md` for detail (progressive disclosure — keeps SKILL.md lean).

## Data Sources

- **Azure DevOps** — PRs, work items, threads (via `az` CLI)
- **Local Git** — commits from current repo
- **Confluence** — documentation search (via Atlassian MCP, optional)

## Dependencies

- Azure CLI with the `azure-devops` extension — required by every skill here
- Atlassian MCP server — bundled as `.mcp.json`, used by `insights` for Confluence page search (optional)
- Deno runtime — for the `insights view` dashboard
- Node — for the `insights` collectors

## Composition

- `feature-branch` invokes `ticket` to set the work item Active (same plugin, always available).
- `ticket-create` and `ticket-comments` go through `az rest` rather than `az boards`, because the CLI cannot pass the Markdown format flag. Both need `AZDO_ORG_URL` / `AZDO_PROJECT` or `az devops configure --defaults`.
- `pr create` errors if on `main` — tells you to run `feature-branch` first.
- `pr create` errors if no commits ahead — tells you to commit first (commit logic intentionally not bundled).

### With the `aiwork` plugin

Optional, and never required. `aiwork:code-review-diff` reviews the diff once `pr checkout <id>` has landed you on the branch, and `aiwork:triage` assesses a work item before you branch off it. Without `aiwork` installed, these skills advise rather than fail — nothing here invokes an `aiwork` skill.

## Layout

```
dev-azdo/
├── .claude-plugin/plugin.json
├── .mcp.json                     # Atlassian HTTP MCP server
└── skills/
    ├── feature-branch/SKILL.md
    ├── pr/
    │   ├── SKILL.md
    │   └── references/{create,checkout,list,complete}.md
    ├── pr-comments/SKILL.md
    ├── ticket/SKILL.md
    ├── ticket-create/SKILL.md
    ├── ticket-comments/SKILL.md
    ├── insights/
    │   ├── SKILL.md
    │   ├── references/{daily,weekly,catchup,view}.md
    │   ├── collectors/   # data fetch scripts
    │   ├── templates/    # report templates
    │   └── dashboard/    # Deno HTML generator
    └── az-cli/
        ├── SKILL.md
        └── references/
```

## Installation

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install dev-azdo@lttr-claude-marketplace --scope local
```
