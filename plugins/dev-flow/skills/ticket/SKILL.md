---
name: ticket
description: Transition Azure DevOps work item state. Trigger when user says "ticket <id> active", "set ticket cr", "/dev-flow:ticket", or wants to move a work item between states (active, code-review, ready, closed).
---

# Ticket

Update Azure DevOps work item state via `az boards work-item update`.

## Input Format

`$ARGUMENTS` = `<id> <state>`.

| Synonym                          | Azure DevOps state |
| -------------------------------- | ------------------ |
| `active`, `start`, `in-progress` | `Active`           |
| `cr`, `code-review`, `review`    | `Code Review`      |
| `ready`, `done-dev`              | `Ready`            |
| `closed`, `done`, `complete`     | `Closed`           |

Unknown state → ask user. Missing id → ask. Missing state → ask.

## Workflow

### 1. Parse + map state

Extract id (numeric) and state synonym. Map to canonical Azure DevOps state.

### 2. Update

```bash
az boards work-item update --id <id> --state "<State>"
```

### 3. Confirm

Print: work item id, title, new state.

## Notes

- States above match the most common Azure DevOps process templates. If your project uses different state names (e.g. `Doing`, `In Review`), pass the exact label.
- Branch creation lives in the `branch` skill — keeps state changes orthogonal.
