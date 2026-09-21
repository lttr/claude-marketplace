---
created: 2026-09-21
type: spec
status: done
references:
  - "Supersedes the skill allocation in: ../2026-07-29_dev-azdo-split/spec.md"
---

# Consolidate `dev-azdo`: 8 skills → 4

## Goal

The plugin shipped 8 skills on 2026-07-29. Seven weeks of usage data says three of
them never route, two are unnecessary, and three ticket skills are one skill split
across three files. Reshape to 4:

| Verdict               | Skills                                                   |
| --------------------- | -------------------------------------------------------- |
| Keep, model-invocable | `ticket` (consolidated), `pr-comments`, `feature-branch` |
| Keep, slash-only      | `pr`                                                     |
| Remove                | `az-cli`, `insights`                                     |
| Merged into `ticket`  | `ticket-create`, `ticket-comments`, `ticket`             |

Net effect: 3 resident descriptions instead of 8, ~400 est. tokens saved per session
in every project, and the AzDO trigger surface stops competing with itself.

## Evidence

All 8 skills were added 2026-07-29 (`refactor(dev-azdo)!` + `feat(dev-azdo): add
ticket-create and ticket-comments`). Retained session transcripts start 2026-07-30,
so **the load counts below cover the plugin's entire lifetime minus day one** — they
are not a sampling window.

| Skill             | Skill loads (lifetime) | Notes                                            |
| ----------------- | ---------------------- | ------------------------------------------------ |
| `feature-branch`  | 2                      | most recent of any                               |
| `pr`              | 2                      | but 1 of 9 PR-op sessions — see below            |
| `pr-comments`     | 1                      |                                                  |
| `ticket-create`   | 1                      |                                                  |
| `az-cli`          | **0**                  | against ~100 `az` invocations in the same period |
| `ticket`          | **0**                  |                                                  |
| `ticket-comments` | **0**                  |                                                  |
| `insights`        | **0**                  |                                                  |

### Why `az-cli` never wins

Its description triggers on "az devops, az repos, az boards, managing PRs, work
items" — the same intents claimed by `pr`, `ticket*`, and `feature-branch`. It lost
every time.

It also has nothing to contribute. In ~100 observed `az` calls the operands came from
elsewhere:

- **Work repos** — org, project and repository are lifted from `git remote -v`.
  `drmax-eshop-admin-workspace` has zero AzDO content in its `CLAUDE.md`, yet produced
  `az repos pr list --org https://dev.azure.com/drmaxglobal --project platform-team
--repository drmax-eshop-admin-workspace` immediately after a `git remote -v` call.
- **`~/code/done`** — has no AzDO remote of its own, so its `CLAUDE.md:68-73` states
  the command and org directly. 62 of the ~100 calls came from there.
- **The subcommands themselves** (`az boards work-item show`, `az repos pr list`) are
  ordinary CLI surface the model supplies unaided.

The content is 30 KB of `az <group> --help` transcribed across `SKILL.md` and four
references — derivable by definition, and stale the moment the extension updates.

### Why `insights` goes

18.5 KB. Hardcodes `drmaxglobal`, `platform-team`, `ecommerce-operations`, so it is
Dr.Max-specific inside a generically-named plugin. Zero loads since the plugin was
created; all ~25 lifetime uses predate April under the `df:` naming. The daily and
weekly roll-up job is done by `~/code/done` (`worklog` 137 uses, `day-start` 66,
`day-end` 61).

### Why `pr` goes slash-only rather than away

16 `az repos pr create|checkout|complete|update` calls across 9 sessions; **1** of
those sessions had loaded the `pr` skill first. The model raw-dials the CLI and
applies the guardrails (refuse on master, refuse with nothing ahead) on its own.

But `references/complete.md` carries real defaults (`--delete-source-branch`, squash)
that are worth keeping. `disable-model-invocation: true` retains the content at
`/dev-azdo:pr` with zero listing cost — the right treatment for
non-derivable-but-never-routed.

### Why the three ticket skills merge

They already cross-reference each other three times:

```
ticket-create/SKILL.md:204   → `dev-azdo:ticket`: transition a work item … Use after creating.
ticket-create/SKILL.md:205   → `dev-azdo:ticket-comments`: post a Markdown comment.
ticket-comments/SKILL.md:142 → To create or edit a Markdown description, see `dev-azdo:ticket-create`.
```

That is one skill wearing three hats, each telling the model to go load another —
the dependency-loaded-after-the-surprise failure mode.

Their three descriptions total 1161 chars (≈290 est. tokens), all triggering on
"ticket" / "work item".

And the **read path has no home at all**. `az boards work-item show` was the third
most-used `az` command observed (14 calls) with no skill covering it; it appears only
incidentally inside `az-cli` (being deleted), `feature-branch`, and `ticket-create`.

## End State

```
plugins/dev-azdo/skills/
  ticket/                     ← consolidated, model-invocable
    SKILL.md                  ← dispatch table only, ~40 lines
    references/create.md      ← ticket-create body verbatim
    references/comment.md     ← ticket-comments body verbatim
    references/show.md        ← NEW: work-item show, --expand relations, projections
  pr-comments/                ← unchanged, model-invocable
  feature-branch/             ← unchanged, model-invocable
  pr/                         ← unchanged body, + disable-model-invocation: true
```

Deleted: `skills/az-cli/` (SKILL.md + 4 references), `skills/insights/`
(SKILL.md + 4 references + 3 templates), `skills/ticket-create/`,
`skills/ticket-comments/`, old `skills/ticket/`.

### `ticket` dispatch

| Op                   | Source                                         |
| -------------------- | ---------------------------------------------- |
| `show <id>`          | new — fills the measured gap                   |
| `create`             | `ticket-create` body verbatim                  |
| `comment <id>`       | `ticket-comments` body verbatim                |
| `state <id> <state>` | old `ticket`'s synonym table, inline (6 lines) |

Nothing in the merged bodies may be lost. Specifically: the
`/multilineFieldsFormat/System.Description` JSON-Patch op, the fixed resource id
`499b84ac-1321-427f-aa17-267ca6975798`, the `TF400813` diagnosis, the
delete-and-recreate caveat, and the Comments REST endpoint vs `System.History`
distinction.

Also not to be lost — the plugin's most recent commit exists to add it
(`feat(dev-azdo): gate work item writes behind approval`): the **show-the-draft-and-
get-approval gate** at `ticket-create/SKILL.md:53-84` and
`ticket-comments/SKILL.md:48-63,116`, including its three qualifiers — a request to
draft is not standing approval to file, approval covers the text as shown, and
approval for one item is not approval for the next. "Verbatim" only protects this if
the implementer knows to look for it.

`show.md` is the one new file. Seed it from shapes already observed in transcripts
rather than inventing them: `--expand relations --query 'relations[].{rel:rel,url:url}'`
for linked PRs and parents, and the
`{title, state, desc, ac:fields."Microsoft.VSTS.Common.AcceptanceCriteria"}`
projection used in session `320dfa8c`.

### The description decides whether this works

The `pr` finding is the warning: a multi-op wrapper lost routing 8 times out of 9,
because the model will not load a skill to do what it already believes it can do —
and for `show` and `state` it genuinely can.

So write `ticket`'s description around the **failure contracts**, not the capability:

> Creating an Azure DevOps work item or posting a comment with the obvious
> `az boards` command silently stores HTML that cannot be fixed afterward — use this
> instead. Also covers reading a work item and transitioning its state.

"Manage Azure DevOps work items" is a claim the model can ignore. A named silent
failure is not. `show` and `state` then ride along as cheap ops inside a skill that
is already loaded for the right reasons.

## Versioning

Per repo convention (major = breaking, minor = new features): **`dev-azdo` → 2.0.0**.
Breaking — `/dev-azdo:az-cli`, `/dev-azdo:insights`, `/dev-azdo:ticket-create` and
`/dev-azdo:ticket-comments` all disappear, and `/dev-azdo:ticket` changes its
argument shape from `<id> <state>` to `<op> …`.

## Migration

1. Create `skills/ticket/references/{create,comment,show}.md`; move the
   `ticket-create` and `ticket-comments` bodies in verbatim; write `show.md`.
2. Rewrite `skills/ticket/SKILL.md` as dispatch + the state synonym table, with the
   failure-first description above.
3. Delete `skills/{az-cli,insights,ticket-create,ticket-comments}/`.
4. Add `disable-model-invocation: true` to `skills/pr/SKILL.md` frontmatter.
5. Update every consumer listed under **Consumers to update** — the
   `feature-branch:69` functional call first, it is the one that breaks.
6. Update `plugin.json:4`, `marketplace.json:40`, and `README.md`'s skill table and
   directory tree.
7. Bump to `2.0.0` in **both** `plugins/dev-azdo/.claude-plugin/plugin.json` and
   `.claude-plugin/marketplace.json`, publish, reinstall. The live copy is the `1.2.0` cache at
   `~/.claude/plugins/cache/lttr-claude-marketplace/dev-azdo/1.2.0/`; source edits do
   nothing until republished.

## Consumers to update

Verified by grep across `plugins/`, `~/work/drmax/**/.claude`, `~/code/done/.claude`
and `~/dotfiles/claude`.

### Functional — breaks if missed

| Site                                         | Current                                    | Change to                  |
| -------------------------------------------- | ------------------------------------------ | -------------------------- |
| `dev-azdo/skills/feature-branch/SKILL.md:69` | "invoke `ticket` skill with `<id> active`" | `ticket state <id> active` |

This is the one in-plugin caller of `ticket`, and the `<id> <state>` → `<op> …`
argument change is exactly what breaks it. The July spec already flagged this edge as
functional rather than advisory.

### Advisory prose — reword

| Site                                          | Names                                                          |
| --------------------------------------------- | -------------------------------------------------------------- |
| `dev-azdo/skills/feature-branch/SKILL.md:78`  | `/dev-azdo:ticket <id> cr` → `/dev-azdo:ticket state <id> cr`  |
| `aiwork/skills/triage/SKILL.md:192`           | `dev-azdo:ticket` — still valid, no change needed              |
| `aiwork/skills/code-review-diff/SKILL.md:142` | `dev-azdo:az-cli` — removed; drop the name, keep `dev-azdo:pr` |

Per the July spec's rule, each stays advisory prose that states its degradation.

### Manifests

| Site                                    | Change                                                                                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev-azdo/README.md:12-15`              | drop the `ticket-create`, `ticket-comments`, `insights` rows; rewrite the `ticket` row's invocation to `<op>`; drop `az-cli` from the table and the tree |
| `dev-azdo/.claude-plugin/plugin.json:4` | description enumerates all 8 skills                                                                                                                      |
| `.claude-plugin/marketplace.json:40-41` | same 8-skill enumeration **and** `"version": "1.2.0"` — the marketplace carries its own copy of the version, so both files bump                          |

There is no CHANGELOG in `plugins/dev-azdo/` — README and the two manifests are the
whole release surface.

### Outside the repo

`~/work/drmax/CLAUDE.local.md:20` names `dev-azdo:az-cli` by hand as the place to
query work items. Rewrite to name the survivors, or `az boards` / `az rest` directly.
Nothing in `~/code/done/.claude` or `~/dotfiles/claude` references the removed names.

## Open question

`pr-comments` and `pr` are kept separate deliberately. PR threads are a different API
on a different object, and `ticket-comments` itself drew that line
(`ticket-comments/SKILL.md:19` — "This is work-item discussion only"). More to the point,
`pr-comments` wins routing where `pr` does not; merging a winner into a loser would
repeat the mistake this spec is correcting. Revisit only if `pr-comments` also stops
routing.
