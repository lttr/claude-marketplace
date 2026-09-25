---
name: pr
description: Azure DevOps pull requests, including comment threads, which `az repos pr` cannot read or post. Use to create a PR for the current branch, check out, list or complete PRs, post code comments on a PR, reply to threads, and assess whether review feedback was addressed. Trigger on "create PR", "checkout PR 123", "list PRs", "complete PR", "comment on the PR", "post these review findings", "check PR feedback", "/dev-azdo:pr".
argument-hint: <create|checkout|list|complete|comments> …
---

# PR (Azure DevOps)

Multi-op skill. Pick the op from the user's request (or the first word of `$ARGUMENTS`), read its reference, run the steps, report the result.

## Dispatch

| Op           | Intent                                                   | Reference                                    |
| ------------ | -------------------------------------------------------- | -------------------------------------------- |
| **create**   | open a PR for the current branch                         | `${CLAUDE_SKILL_DIR}/references/create.md`   |
| **checkout** | switch to a PR's source branch, by id or URL             | `${CLAUDE_SKILL_DIR}/references/checkout.md` |
| **list**     | active PRs, `mine` (default) or `all`                    | `${CLAUDE_SKILL_DIR}/references/list.md`     |
| **complete** | merge the current branch's PR                            | `${CLAUDE_SKILL_DIR}/references/complete.md` |
| **comments** | post code comments, reply to threads, assess PR feedback | `${CLAUDE_SKILL_DIR}/references/comments.md` |

Ambiguous intent: ask.

## Notes

- `create` errors if on `main`/`master` and tells the user to run `feature-branch` first.
- `create` errors if no commits are ahead of base and tells the user to commit first. Commit logic is intentionally not bundled.
- For reviewing the diff, `aiwork:code-review-diff` does it if the `aiwork` plugin is installed. Not required. This skill never invokes it. Its findings can be posted with the `comments` op.
