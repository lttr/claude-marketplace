---
name: ticket
description: Creating an Azure DevOps work item or posting a comment with the obvious `az boards` command silently stores HTML that cannot be fixed afterward. Use this instead. Also covers reading a work item and transitioning its state. Trigger on "create ticket", "new work item", "comment on #N", "show ticket", "set ticket cr", "/dev-azdo:ticket".
allowed-tools: Bash(az *), Bash(cat *), Bash(trash-put *), Read, Write, Edit
argument-hint: <show|create|comment|state> <id> …
---

# Ticket (Azure DevOps work item)

Multi-op skill. Dispatch on the first word of `$ARGUMENTS`.

## Dispatch

| Op          | Arguments                                                                              | Reference                                   |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| **show**    | `<id>`                                                                                 | `${CLAUDE_SKILL_DIR}/references/show.md`    |
| **create**  | `<title> [--type …] [--parent <id>] [--tags a,b] [--description-file <path>]`          | `${CLAUDE_SKILL_DIR}/references/create.md`  |
| **comment** | `<id> [--text "…"] [--text-file <path>] [--update <commentId>] [--delete <commentId>]` | `${CLAUDE_SKILL_DIR}/references/comment.md` |
| **state**   | `<id> <state>`                                                                         | inline, below                               |

Unknown op, or an op with no id where one is required: ask the user. A bare `<id> <state>` pair with no op word means `state`.

`create` and `comment` write to a shared board under the user's name. Both references gate the write behind showing the full draft and getting an explicit go-ahead. Do not skip that step.

## state

```bash
az boards work-item update --id <id> --state "<State>"
```

| Synonym                          | Azure DevOps state |
| -------------------------------- | ------------------ |
| `active`, `start`, `in-progress` | `Active`           |
| `cr`, `code-review`, `review`    | `Code Review`      |
| `ready`, `done-dev`              | `Ready`            |
| `closed`, `done`, `complete`     | `Closed`           |

Unknown synonym: ask. These names match the common process templates. If the project uses others (`Doing`, `In Review`), pass the exact label. Confirm by printing id, title and the new state.

## Notes

- Branch creation lives in `dev-azdo:feature-branch`, which calls `ticket state <id> active` after branching if the user wants it.
- Pull-request threads are a different API. Use `dev-azdo:pr-comments`.
