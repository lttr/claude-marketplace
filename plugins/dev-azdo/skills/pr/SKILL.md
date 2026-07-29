---
name: pr
description: Manage Azure DevOps pull requests — create, checkout, list, complete. Trigger when user says "/dev-azdo:pr <op>", "create PR", "checkout PR 123", "list PRs", "complete PR", or otherwise asks to operate on an AZDO pull request.
---

# PR (Azure DevOps)

Multi-op skill. Dispatch on first word of `$ARGUMENTS`.

## Dispatch

| Op           | First word(s)                    | Reference                |
| ------------ | -------------------------------- | ------------------------ |
| **create**   | `create` (or empty)              | `references/create.md`   |
| **checkout** | `checkout <id>`                  | `references/checkout.md` |
| **list**     | `list` (optional `mine` / `all`) | `references/list.md`     |
| **complete** | `complete`                       | `references/complete.md` |

Unknown op → ask user.

## Workflow

1. Parse op from `$ARGUMENTS`
2. Read corresponding `references/<op>.md`
3. Execute steps in that file
4. Report result

## Notes

- `create` errors if on `main`/`master` — tells user to run `feature-branch` first.
- `create` errors if no commits ahead of base — tells user to commit first (commit logic is intentionally not bundled).
- For PR comment threads, use `pr-comments` skill.
- For reviewing the diff, `aiwork:code-review-diff` does it if the `aiwork` plugin is installed. Not required — this skill never invokes it; without it, review the diff however you normally would.
