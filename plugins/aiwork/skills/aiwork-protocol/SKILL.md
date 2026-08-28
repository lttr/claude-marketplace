---
name: aiwork-protocol
description: Structure AI work artifacts under .aiwork/{YYYY-MM-DD}_{slug}/ folders using the project's protocol (triage, research, spec, prd, areas, plan, review, notes, docs/). Use when the user asks to plan, make a spec, triage, research a task, write a report, code review, summarize findings, save the work, document decisions, record this, write that down, persist findings, or references any path under .aiwork/. Also use when starting a non-trivial task that needs a plan or spec before implementation, or when finishing one and capturing notes.
---

# .aiwork Folder Protocol

Repository-local folder for AI work artifacts, organized by feature or task. Artifacts structure thinking in-session and provide context for future sessions when referenced manually.

## Folder layout

```
.aiwork/
  2026-01-27_auth-refactor/
    triage.md
    spec.md
```

- **Folder:** `{YYYY-MM-DD}_{slug}/`, slug lowercase kebab-case, max 40 chars.
- **File:** `{type}.md`. Numbering for multiples of same type:
  - `plan.md` → `plan_2.md` → `plan_3.md` — when one plan was expected, more followed.
  - `plan_1.md` → `plan_2.md` → `plan_3.md` — when multiple are expected from the start.
  - Don't mix schemes in one folder.
- **Multi-day:** optionally prefix filenames with `{YYYY-MM-DD}_`.

Usually 1-2 artifacts per task. Pick types that fit.

## Grouping and restructuring

One task = one folder. Drift signals:

- Two folders with overlapping scope or near-identical slugs
- Cross-folder `references:` / "Source plan: ../..." pointers
- Folder that exists only because a ticket number arrived mid-task

On drift, propose consolidation: move artifacts into the canonical folder with a `superseded_by:` pointer, or merge under one date. Ask before moving files.

A pointer to an epic's `areas.md` is **not** drift — it's a legitimate parent link (see below). Drift is two folders for the _same_ task.

## Epics

A folder is dated when its work starts and holds a few hours' to a few days' work. A big idea doesn't fit: months can pass between framing it and finishing the last piece.

So split it. The **epic folder** is an index, not a task: `spec.md` (or nothing, when the framing is short) plus `areas.md`. Each area later becomes a normal task folder, dated when it actually starts.

```
.aiwork/
  2026-06-09_kurzy-platforma/     # epic, framed in June
    spec.md
    areas.md
  2026-08-28_auth-layer/          # area 02, started in August
    spec.md
    tickets/
```

The presence of `areas.md` is what marks a folder as an epic. Its area entries carry the roll-up:

```markdown
## 02 — Auth layer

**Status:** in-progress → `../2026-08-28_auth-layer/`
```

One line edited when an area starts, one when it's done. The area's own spec points back with the existing `references:` field (`"Epic: ../2026-06-09_kurzy-platforma/areas.md"`) — no dedicated field for it.

Write each area's spec lazily, when its turn comes. Don't spec wave 4 during wave 1.

## Artifact types (all optional)

- **triage** — problem framing, what's known
- **research** — codebase exploration, doc reading
- **prd** — product requirements, success criteria
- **spec** — technical/architecture decisions
- **areas** — decomposition of an oversized spec into areas, each becoming its own task folder later: dependency graph, wave order, and per area its deliverables, what it depends on, how it's verified, and a status line (see Epics)
- **plan** — actionable implementation steps
- **review** — code review report
- **notes** — findings, decisions from implementation
- **implementation-notes** — short log kept by `/implement`, for what the reader must act on. Work only a human can finish, anything left unverified, decisions taken where the spec was silent, deviations, contradicted assumptions, a stopped chain. Never what was built or tested. Many tickets warrant no entry.
- **tickets/** — subfolder of vertical-slice tickets, one file per ticket (`NN_slug.md`, numbered in dependency order), `status` + `blocked_by` in frontmatter; created by `/to-tickets`, worked by `/implement-spec` (or `/implement` for a single ticket)
- **docs/** — subfolder for downloaded external docs

Custom types (`cascade-map.md`, `checklist.md`) are fine when they fit better.

**Division of labor with `triage`:** both skills trigger on the word "triage". **`aiwork-protocol` decides where the artifact lands; `triage` decides what goes in it.** Producing the report content is `triage`'s job — this skill only names and places the file.

## When to create a new plan

New plan file when the approach changes or new constraints emerge between iterations. Otherwise continue the previous plan — don't start one just because the session is new.

## Frontmatter

Folder date + filename already encode creation time and type, so don't duplicate. Add structured data that's useful for the artifact.

```yaml
---
ticket: #123456
references:
  - "Parent: #38234"
  - https://docs.example.com/auth
story_points: 8
superseded_by: plan_2.md
---
```

Common fields: `ticket`, `references`, `superseded_by`. Avoid fields that need manual upkeep across sessions.

### `status` on spec and plan artifacts

The one field worth the upkeep: without it a folder with no `tickets/` is
indistinguishable from a finished one. Set it on `spec.md` (or the current
`plan*.md` when there is no spec) and update it as the work moves.

| `status`      | Meaning                                                 |
| ------------- | ------------------------------------------------------- |
| `not-started` | Written down, no code yet                               |
| `in-progress` | Implementation under way                                |
| `blocked`     | Waiting on something — add `blocked_by:` with the cause |
| `done`        | Implemented and verified                                |
| `abandoned`   | Dropped or superseded — pair with `superseded_by:`      |

An absent `status` means unknown, not not-started — a task is split into
`tickets/` only when that is worth doing, so neither the missing field nor the
missing tickets say anything about whether the work happened.

Folders that use `tickets/` don't need it: ticket statuses already say where the
work stands.

```yaml
---
status: blocked
blocked_by: waiting on the payment-gateway contract
---
```

## Version control

Whether to commit `.aiwork/` is up to the project — either traceability or ephemeral working artifacts is fine.
