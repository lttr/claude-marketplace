# dev-azdo

Azure DevOps workflow automation. Single primitive: skills. Each is invokable as `/dev-azdo:<skill>` with natural-language args, no rigid flags.

## Skills

| Skill            | Invoke                           | Purpose                                                                   |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------- |
| `ticket`         | `/dev-azdo:ticket <op> <id> …`   | `show` / `create` / `comment` / `state` on a work item, Markdown-aware    |
| `feature-branch` | `/dev-azdo:feature-branch <tkt>` | `feature/<id>-<slug>` from ticket title, optional ticket Active toggle    |
| `pr`             | `/dev-azdo:pr <op>`              | `create` / `checkout <id>` / `list [mine\|all]` / `complete` / `comments` |

All skills are also model-invoked: Claude loads them when the conversation calls for them. `pr` covers comment threads too, because `az repos pr` cannot read or post them and the model needs the `az devops invoke` recipes. `pr` only acts in repos whose `origin` is on `dev.azure.com` or `*.visualstudio.com`, and stops elsewhere.

## Multi-op Skills

`ticket` and `pr` pick the op from the intent of the request, then load `references/<op>.md` for detail (progressive disclosure keeps SKILL.md lean).

## Shared conventions

`references/conventions.md` holds the rules every skill follows:

- **One resolution order** for org, project and repo: the request, the git remote, `AZDO_ORG_URL` / `AZDO_PROJECT`, `az devops configure --defaults`, then ask. Never guessed.
- **Default branch** from `origin/HEAD` or the Azure DevOps repo, never assumed to be `main` or `master`.
- **Approval gate** for every write others see: work items, work-item comments, opening a PR, PR threads and replies, completing a PR. The full draft is shown and nothing is written without an explicit go-ahead. A request to post is not approval.
- **One writing guideline** for everything written to Azure DevOps: lead with the point, keep it short.
- **Shell-neutral recipes.** Only `az` and `git` invocations are spelled out. JSON bodies go through a temp file written with the Write tool.
- Values that vary per project (work item types, states) are looked up, not hardcoded.

## Dependencies

- Azure CLI with the `azure-devops` extension. Every skill here needs it.

## Composition

- Every work-item state change goes through `ticket state` and is offered, never automatic: `feature-branch` offers Active, `pr create` offers Code Review, `pr complete` proposes the next state from the work item type's own states and transitions.
- `ticket create` and `ticket comment` go through `az rest` rather than `az boards`, because the CLI cannot pass the Markdown format flag.
- `pr create` stops on the default branch and tells you to run `feature-branch` first.
- `pr create` stops if no commits are ahead and tells you to commit first (commit logic intentionally not bundled).
- `feature-branch` branches from the current HEAD and asks first when that is not the default branch.

### With the `aiwork` plugin

Optional, and never required. `aiwork:code-review-diff` reviews the diff once `pr checkout <id>` has landed you on the branch, and `aiwork:triage` assesses a work item before you branch off it. `pr comments` maps review findings to PR threads and posts them after one approval that covers the shown batch. Without `aiwork` installed, these skills advise rather than fail. Nothing here invokes an `aiwork` skill.

## Layout

```
dev-azdo/
├── .claude-plugin/plugin.json
├── references/conventions.md     # shared rules
└── skills/
    ├── ticket/
    │   ├── SKILL.md              # dispatch
    │   └── references/{show,create,comment,state}.md
    ├── feature-branch/SKILL.md
    └── pr/
        ├── SKILL.md
        └── references/{create,checkout,list,complete,comments}.md
```

## Installation

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install dev-azdo@lttr-claude-marketplace --scope local
```
