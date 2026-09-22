# dev-azdo

Azure DevOps workflow automation. Single primitive: skills. Each is invokable as `/dev-azdo:<skill>` with natural-language args, no rigid flags.

## Skills

| Skill            | Invoke                           | Purpose                                                                |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `ticket`         | `/dev-azdo:ticket <op> <id> …`   | `show` / `create` / `comment` / `state` on a work item, Markdown-aware |
| `feature-branch` | `/dev-azdo:feature-branch <tkt>` | `feature/<id>-<slug>` from ticket title, optional ticket Active toggle |
| `pr`             | `/dev-azdo:pr <op>`              | `create` / `checkout <id>` / `list [mine\|all]` / `complete`           |
| `pr-comments`    | `/dev-azdo:pr-comments [id]`     | Read, assess, post AZDO PR thread comments                             |

`ticket`, `feature-branch` and `pr-comments` are also model-invoked: Claude loads them when the conversation calls for them. `pr` is slash-only. The model drives `az repos pr` on its own well enough, so the skill only keeps the defaults for `complete` (squash, delete source branch) and the create-time guardrails.

## Multi-op Skills

`ticket` and `pr` dispatch on the first arg, then load `references/<op>.md` for detail (progressive disclosure keeps SKILL.md lean).

## Dependencies

- Azure CLI with the `azure-devops` extension. Every skill here needs it.

The Atlassian MCP server used to ship here as `.mcp.json`. It moved to its own [`confluence`](../confluence) plugin — install that if you want Confluence search.

## Composition

- `feature-branch` invokes `ticket state <id> active` to set the work item Active (same plugin, always available).
- `ticket create` and `ticket comment` go through `az rest` rather than `az boards`, because the CLI cannot pass the Markdown format flag. Both need `AZDO_ORG_URL` / `AZDO_PROJECT` or `az devops configure --defaults`.
- Both show the drafted text and wait for approval before writing anything to Azure DevOps. Work items and comments are visible to the team and notify watchers, and comment deletion has no recycle bin.
- `pr create` errors if on `main` and tells you to run `feature-branch` first.
- `pr create` errors if no commits ahead and tells you to commit first (commit logic intentionally not bundled).

### With the `aiwork` plugin

Optional, and never required. `aiwork:code-review-diff` reviews the diff once `pr checkout <id>` has landed you on the branch, and `aiwork:triage` assesses a work item before you branch off it. Without `aiwork` installed, these skills advise rather than fail. Nothing here invokes an `aiwork` skill.

## Layout

```
dev-azdo/
├── .claude-plugin/plugin.json
└── skills/
    ├── ticket/
    │   ├── SKILL.md              # dispatch + state synonyms
    │   └── references/{show,create,comment}.md
    ├── feature-branch/SKILL.md
    ├── pr/
    │   ├── SKILL.md
    │   └── references/{create,checkout,list,complete}.md
    └── pr-comments/SKILL.md
```

## Installation

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install dev-azdo@lttr-claude-marketplace --scope local
```
