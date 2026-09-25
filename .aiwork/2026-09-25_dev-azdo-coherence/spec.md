---
status: not-started
references:
  - "Follows: ../2026-09-21_dev-azdo-consolidation/spec.md (its open question on pr/pr-comments is resolved by 060d81d)"
  - "Merge commit: 060d81d refactor(dev-azdo)!: merge pr-comments into model-invoked pr skill"
---

# `dev-azdo` coherence fixes

## Goal

After `pr-comments` merged into a model-invoked `pr`, the plugin's skills work together at
the seams (branch naming, ticket id extraction, cross-references), but `ticket` and `pr`
follow different rules for write safety, config resolution and shell handling. Align them,
fix the bugs found on read-through, and refresh stale docs.

Findings come from a static read of every file in `plugins/dev-azdo/`. Nothing was
exercised at runtime. Items marked **Checked** were confirmed on 2026-09-25 against the REST 7.1
docs and the local `az` CLI (azure-devops extension 1.0.2), not by calling the live API.

## Real problems

### 1. Write-approval gate is inconsistent

`ticket create` and `ticket comment` print the full draft and wait for an explicit go-ahead
before any write. `pr` has no gate anywhere, yet it has the most outward-facing writes:

- `comments`: posts threads under the user's name and notifies reviewers
- `complete`: merges and deletes the source branch
- `create`: pushes and opens the PR

Since `pr` is now model-invoked, "post these review findings" could post many threads
unreviewed.

**Fix:** add a gate to `comments` (print each thread's file, line range and body verbatim),
`complete` (print PR id, title, target branch, work-item transition choice) and `create`
(print title, description, target, linked work item). Reuse `ticket`'s rules: full text not
a summary, a request to post is not approval, re-show after amendments, one approval per
write unless the user approves a shown batch explicitly.

**Decided:** all three wait for human approval, `create` included.

### 2. `pr` can trigger in GitHub repos

Trigger phrases ("create PR", "list PRs") are platform-neutral, and `pr` is now
model-invoked. Nothing checks the remote.

**Fix:** state in the description that it applies to Azure DevOps remotes
(`dev.azure.com`, `*.visualstudio.com`). Add a pre-flight in `SKILL.md`: if
`git remote get-url origin` is not an AzDO URL, stop and say so.

### 3. Base-branch detection is broken — `pr/references/create.md:12`

```bash
base=$(git rev-parse --verify master 2>/dev/null && echo master || echo main)
```

`rev-parse --verify` prints the sha to stdout, so `base` becomes `<sha>\nmaster`. It also
only knows `master`/`main`.

**Fix:** resolve the repo's default branch (for example the target of `origin/HEAD`, or
the AzDO repo's `defaultBranch`), falling back to asking. Same logic for the
"on base branch" guard, which today hardcodes `main`/`master`.

### 4. Shell variables carried across Bash calls

`ticket` warns that variables do not survive between Bash calls and requires pasting
literals. `pr` breaks this:

- `complete.md` sets `$pr` in step 1 and uses it in step 2
- `list.md` sets `$me`, `$repo`, `$project` in one block and uses them in others

**Fix:** adopt `ticket`'s pattern. A resolve step prints the values, later commands use
the literals.

### 5. Org/project resolution: three strategies

- `ticket`: `AZDO_ORG_URL` / `AZDO_PROJECT`, falling back to `az devops configure`, never guess
- `pr/references/comments.md:21`: "from git remote or `az devops configure --list`"
- `pr/references/list.md:44`: `az devops configure -l --query …`. **Checked:** `configure -l`
  prints INI-style text and ignores `--query`, so this returns the whole block, not the
  project name. Broken.

**Fix:** one documented resolution order for the whole plugin. `az repos pr` commands
auto-detect from the git remote. **Checked** (`az devops invoke -h`, azure-devops 1.0.2):
`invoke` has `--detect`, which covers the **organization only**. `project` is a route
parameter and must always be passed explicitly. `invoke` also defaults to
`--api-version 5.0`, and the recipes don't pass one, so pin `7.1`. The git remote is a
reasonable first source for `pr`, with `ticket`'s env/config fallback
and "never guess" rule. Put it in one place and point to it.

### 6. Thread status: numbers vs strings — `pr/references/comments.md`

The reference documents numeric statuses (0–6) for creating threads, while the jq filter
(`comments.md:126`) compares `.status` against the string `"closed"`, and `list.md` filters
on `` `active` ``. The jq filter also keeps `fixed` / `wontFix` / `byDesign` threads though
the assess step targets only active/pending ones.

**Checked** (REST 7.1 docs, Pull Request Threads List/Create): POST takes numbers
(`"status": 1`, `"commentType": 1`, as the recipe already does), GET returns strings
(`unknown`, `active`, `fixed`, `wontFix`, `closed`, `byDesign`, `pending`). So the string
comparisons are right, only the filter is too loose. System threads (merge attempts, votes,
ref updates) carry no `status` and no `threadContext`, and the `filePath` filter already
drops them.

**Fix:** document both forms side by side (number to write, string to read). Filter the
assess step to `active` and `pending` only.

## Workflow gaps

### 7. Ticket state lifecycle has a hole

- `feature-branch` offers `ticket state <id> active`
- `pr create` does not offer `ticket state <id> cr`, though the synonym exists for it
- `pr complete` uses AzDO's `--transition-work-items`, a second mechanism beside `ticket state`

**Decided:** every transition goes through `ticket state` and is offered, never automatic.

- `pr create`: ask whether to move the linked ticket to Code Review.
- `pr complete`: drop `--transition-work-items`. The next state after merge varies by
  project (Done, Closed, Ready, some Testing state), so look up the states that the work
  item's type actually has, propose the one that follows the current state, and ask. If
  the next state is unclear, list the available states and let the user pick.
- The same lookup backs `ticket state` when a synonym does not match any real state,
  instead of a bare "unknown synonym: ask".

**Checked** (REST 7.1 docs, Work Item Types Get / Work Item Type States List):

- `GET {org}/{project}/_apis/wit/workitemtypes/{type}/states?api-version=7.1` returns
  `name`, `color`, `category`. Categories are `Proposed`, `InProgress`, `Resolved`,
  `Completed` (plus `Removed`). The docs don't promise any ordering.
- `GET {org}/{project}/_apis/wit/workitemtypes/{type}?api-version=7.1` returns the same
  `states` plus `transitions`: a map from each state to its allowed target states.

Use the type definition. From the item's current state, take the allowed transitions, drop
the self-transition and anything whose category moves backwards, and rank the rest by
category. One candidate: propose it. Several (e.g. `Resolved` vs `Closed`, or a custom
Testing state): list them and ask. The work item's type comes from
`System.WorkItemType` on the item itself.

### 8. Review findings → PR comments hand-off is undefined

`aiwork:code-review-diff` produces findings, `pr comments` posts them, but nothing says how a
finding maps to `filePath` + line range, or how approval works for a batch.

**Fix:** a short section in `comments.md`: map each finding to a thread (file, right-side
line range, body), show the whole batch, and get one
approval that explicitly covers it (ties into item 1).

### 9. `feature-branch` return point and branch base

`feature-branch/SKILL.md:54` records the current branch as a "return point" that is never
used. The branch is created from HEAD, so running it from another feature branch stacks the
new branch on it.

**Decided:** keep branching from the current HEAD. When the current branch is not the base
branch (item 3's resolver), say which branch it is and ask whether stacking on it is
intended before creating the new branch. Drop the unused return point.

## Stale or inconsistent docs

- `ticket/SKILL.md:11` dispatches on "the first word of `$ARGUMENTS`". It is model-invoked,
  so switch to intent dispatch like `pr`.
- `plugins/dev-azdo/README.md:4` promises "no rigid flags", while `ticket` documents
  `--type`, `--text-file`, `--update` and `pr complete` documents `--transition-work-items`.
  **Decided:** drop the flags. Dispatch tables describe inputs in plain language. Values
  that vary per project (work item types, states) are looked up from the project, not
  hardcoded. `ticket/references/create.md` today bakes `$Technical%20task` into the
  create URL. It should list the project's types and pick the one matching the request,
  asking when unclear.
- `plugins/dev-azdo/README.md:31` says `pr create` errors "if on `main`". It checks
  `main`/`master` (and after item 3, the default branch).
- `plugins/dev-azdo/README.md:24`: Atlassian MCP note is history, not current docs. Remove.
- `ticket/references/create.md:201` lists `pr` operations without `comments`.
- Style drift between `ticket` and `pr`:
  - request bodies: `ticket` writes a `/tmp` file and removes it with `trash-put`, `pr` uses
    `--in-file <(heredoc)`. **Decided:** temp file everywhere, OS-agnostic. Create the JSON
    with the Write tool (no heredoc quoting), in the OS temp directory rather than a
    hardcoded `/tmp`, pass it via `--body @<path>` / `--in-file <path>`, and remove it
    afterwards without assuming `trash-put` exists
  - only `ticket` sets `allowed-tools`. **Decided:** remove it. No skill sets it, the user's
    permission settings govern, which fits ad hoc tool choice (see Shell neutrality)
  - writing rules differ across `ticket comment`, `ticket create` and `pr comments`, and
    `pr create` prescribes a "1-3 bullet summary". **Decided:** replace all of them with one
    shared guideline for everything written to Azure DevOps (PR comments, PR descriptions,
    work-item descriptions and comments):

    > Readers skim these in a notification. Lead with the point and keep it short. Add
    > structure only where it helps the reader act, like a "How to test" section in a PR
    > description. Length comes from facts the reader needs, not from filler.

    Keep the ticket title rule ("names a verifiable thing, not a region"), which is about
    content, not style. Everything else stylistic goes: personal style lives in the
    author's own setup, and the approval gate (item 1) lets them trim each draft

## Shell neutrality

**Decided:** recipes are shell-neutral. They keep the `az` and `git` invocations (with
`--query` / `-o json|tsv` where it narrows output), and describe the rest as intent, e.g.
"if org or project is empty, stop and ask" rather than `${VAR:?}`. No bash-only constructs
(`$(...)`, process substitution, `sed`/`grep`/`cut` pipelines) in the instructions. Claude
picks whatever filtering or text tools the environment offers (jq, grep, PowerShell, reading
the JSON directly) ad hoc. This supersedes the shell-variable pattern in item 4: resolve
values, print them, then use the literals.

## Out of scope

- Runtime verification of the existing recipes against a live org
- Version bump. `/release` handles it
