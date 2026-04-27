---
name: branch
description: Create a feature branch from an Azure DevOps ticket. Fetches ticket title, slugifies, creates `feature/<id>-<slug>`, and optionally transitions ticket to Active. Trigger when user says "branch", "create branch", "/df:branch", or provides a ticket id/URL to start work on.
---

# Branch

Create `feature/<ticket-id>-<slug>` from an Azure DevOps work item.

## Input Detection

Argument is `$ARGUMENTS`.

| Form                                  | Meaning                                     |
| ------------------------------------- | ------------------------------------------- |
| empty                                 | look in recent context for ticket; else ask |
| numeric (`12345`)                     | ticket id, fetch title for slug             |
| URL containing `_workitems/edit/<id>` | extract id, fetch title                     |
| `<id> <slug-override>`                | use override slug, skip title fetch         |

## Workflow

### 1. Resolve ticket + slug

#### empty

Scan recent conversation for work item id + title (e.g. prior triage output). Else ask user.

#### id / URL

```bash
az boards work-item show --id <id> --query "{id:id,title:fields.\"System.Title\"}" -o json
```

Slugify title: lowercase, strip special chars, spaces→hyphens, 3–5 words max.

#### `<id> <override>`

Use override directly. Slugify same rules.

### 2. Pre-flight

```bash
git status --short
```

If dirty → warn, ask: stash / abort.

```bash
git branch --show-current
```

Note current branch (return point).

### 3. Create branch

```bash
git checkout -b feature/<id>-<slug>
```

If branch already exists → switch to it instead, inform user.

### 4. Optional: transition ticket → Active

Prompt: "Transition ticket #<id> to Active? (y/N)"

Default: **No**.

If yes → invoke `ticket` skill with `<id> active`.

### 5. Confirm

Print created branch name + ticket transition status.

## Notes

- Branch and ticket transition are intentionally separate — `branch` only prompts; clean separation.
- For follow-up state changes use `ticket` skill (`/df:ticket <id> cr`, etc.).
