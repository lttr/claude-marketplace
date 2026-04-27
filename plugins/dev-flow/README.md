# dev-flow

Developer workflow automation. Single primitive: skills. Each is invokable as `/df:<skill>` with natural-language args — no rigid flags.

## Skills

| Skill         | Invoke                             | Purpose                                                                |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| `triage`      | `/df:triage [id\|url\|.md\|text]`  | Assess requirement completeness, ask clarifying questions              |
| `code-review` | `/df:code-review [id\|ref\|.diff]` | Read-only review of branch / AZDO PR / git ref / diff file             |
| `branch`      | `/df:branch <ticket>`              | `feature/<id>-<slug>` from ticket title, optional ticket Active toggle |
| `pr`          | `/df:pr <op>`                      | `create` / `checkout <id>` / `list [mine\|all]` / `complete`           |
| `pr-comments` | `/df:pr-comments [id]`             | Read, assess, post AZDO PR thread comments                             |
| `ticket`      | `/df:ticket <id> <state>`          | Transition AZDO work item (state synonyms: active/cr/ready/closed)     |
| `insights`    | `/df:insights <op>`                | `daily` / `weekly` / `catchup` / `view` activity reports               |
| `az-cli`      | (model-invoked)                    | NL-driven Azure DevOps CLI reference                                   |

## Multi-op Skills

`pr` and `insights` dispatch on the first arg, then load `references/<op>.md` for detail (progressive disclosure — keeps SKILL.md lean).

## Not Included (Personal)

`commit` and `spec` previously lived here but reflect personal preferences (commitlint shape, prettier hook, ticket extraction; spec template + sectioning). They ship as user dotfiles instead. To author your own:

```
~/.claude/skills/commit/SKILL.md
~/.claude/skills/spec/SKILL.md
```

When team conventions stabilize, add a project-local skill to override.

## Data Sources

- **Local Git** — commits from current repo
- **Azure DevOps** — PRs, work items, threads (via `az` CLI)
- **Confluence** — documentation search (via Atlassian MCP, optional)

## Dependencies

- Azure CLI with `azure-devops` extension (for AZDO skills)
- Atlassian MCP server (for Confluence — optional)
- Deno runtime (for `insights view` dashboard)

## .aiwork/ Output

Skills save artifacts to per-task folders:

```
.aiwork/
  2026-01-15_auth-refactor/
    triage.md
    review.md
```

Folder format: `{YYYY-MM-DD}_{slug}`. Follow-up artifacts (review after triage) land in the same folder when one exists. If your project defines an `.aiwork/` protocol (naming, frontmatter), dev-flow follows it.

## Composition

- `branch` does NOT auto-transition the ticket — call `ticket` separately (clean separation).
- `pr create` errors if on `main` — tells you to run `branch` first.
- `pr create` errors if no commits ahead — tells you to commit first (commit logic intentionally not bundled).
- `code-review` is a reusable pipeline — other skills can pass a diff path to it.

## Layout

```
dev-flow/
├── .claude-plugin/plugin.json
└── skills/
    ├── triage/SKILL.md
    ├── code-review/
    │   ├── SKILL.md
    │   └── references/pipeline.md
    ├── branch/SKILL.md
    ├── pr/
    │   ├── SKILL.md
    │   └── references/{create,checkout,list,complete}.md
    ├── pr-comments/SKILL.md
    ├── ticket/SKILL.md
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
