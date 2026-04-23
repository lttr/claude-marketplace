---
created: 2026-04-23
type: plan
status: ready
references:
  - spec.md
---

# Dev-Flow Consolidation — Implementation Plan

## Resolved Decisions

| #   | Decision                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------- |
| 1   | `pr create` w/o commit → error + instruct. No inline commit fallback.                                |
| 2   | `branch` prompts y/n to transition ticket Active. Default no.                                        |
| 3   | `insights` infra kept as-is. No trim.                                                                |
| 4   | `pr-comments` ships. Model-invokable value.                                                          |
| 5   | Staged commits: 8× `refactor(dev-flow): consolidate <skill>` + docs + version bump.                  |
| 6   | **3.0.0 major** bump. Slash paths change `/df:*` → `/dev-flow:*`.                                    |
| 7   | `code-review` input: path/ref only. PR#/URL, git ref, `.diff`/`.patch` path, empty. No pasted diffs. |

## Phase 1 — Pre-work

- [ ] Export `plugins/dev-flow/commands/commit.md` → user's `~/.claude/skills/commit/SKILL.md` (user's own dotfiles; may do later)
- [ ] Export `plugins/dev-flow/commands/spec.md` + `plugins/dev-flow/skills/spec/` → user's `~/.claude/skills/spec/` (may do later)
- [ ] Confirm sub-op dispatch pattern: **body switch + `references/<op>.md` progressive-load**. Body has short dispatch table, references hold details.

## Phase 2 — Skill Migration

Order: simple → complex. Each ends with commit.

### 2.1 `code-review`

- [ ] Create `skills/code-review/SKILL.md`
- [ ] Body: input detection (PR#/URL/ticket→PR via az/ref/diff-path/empty), delegate to pipeline
- [ ] Move existing pipeline body → `references/pipeline.md` (progressive load)
- [ ] Absorb `commands/review.md` + `commands/azdo/review.md` logic
- [ ] Delete old `commands/review.md`, `commands/azdo/review.md`
- [ ] Smoke: `/dev-flow:code-review` (empty), `/dev-flow:code-review 12345` (PR#)
- [ ] Commit: `refactor(dev-flow): consolidate code-review skill`

### 2.2 `triage`

- [ ] Create `skills/triage/SKILL.md` (replace existing)
- [ ] Body: input detection (ticket id/URL vs pasted text vs md path vs empty)
- [ ] If ticket: azdo fetch + Confluence search; else skip
- [ ] Absorb `commands/triage.md` + `commands/azdo/triage.md`
- [ ] Delete `commands/triage.md`, `commands/azdo/triage.md`, old `skills/triage/` content replaced
- [ ] Smoke: `/dev-flow:triage` (prompt), `/dev-flow:triage 12345`
- [ ] Commit: `refactor(dev-flow): consolidate triage skill`

### 2.3 `branch`

- [ ] Create `skills/branch/SKILL.md`
- [ ] Body: parse ticket id/URL, fetch title, slugify → `feature/<id>-<slug>`, `git checkout -b`
- [ ] After create: prompt "Transition ticket to Active? (y/N)" — if yes, invoke `ticket` skill
- [ ] Absorb `commands/azdo/branch.md`
- [ ] Delete `commands/azdo/branch.md`
- [ ] Smoke: `/dev-flow:branch 12345`
- [ ] Commit: `refactor(dev-flow): add branch skill`

### 2.4 `ticket`

- [ ] Create `skills/ticket/SKILL.md`
- [ ] Body: parse `<id> <state>` (state synonyms: `active`, `cr`/`code-review`, `ready`, `closed`); call `az boards work-item update`
- [ ] Absorb `commands/azdo/ticket/{start,cr}.md`
- [ ] Delete `commands/azdo/ticket/`
- [ ] Smoke: `/dev-flow:ticket 12345 active`, `/dev-flow:ticket 12345 cr`
- [ ] Commit: `refactor(dev-flow): consolidate ticket skill`

### 2.5 `pr-comments`

- [ ] Create `skills/pr-comments/SKILL.md` (rename from `azdo-pr-comments`)
- [ ] Port existing content
- [ ] Input: PR id/URL or empty (current branch PR)
- [ ] Delete old `skills/azdo-pr-comments/`
- [ ] Smoke: `/dev-flow:pr-comments` on current branch
- [ ] Commit: `refactor(dev-flow): rename azdo-pr-comments to pr-comments`

### 2.6 `pr` (multi-op)

- [ ] Create `skills/pr/SKILL.md` with dispatch table
- [ ] `references/create.md` — commit-first check (error if no commits ahead), push -u, open PR. Error on main.
- [ ] `references/checkout.md` — fetch + checkout PR source branch
- [ ] `references/list.md` — query PRs (mine/all), unresolved comments count
- [ ] `references/complete.md` — merge current-branch PR, delete source
- [ ] Absorb `commands/azdo/pr/{create,checkout,list,complete}.md`
- [ ] Delete `commands/azdo/pr/`
- [ ] Smoke: each sub-op
- [ ] Commit: `refactor(dev-flow): consolidate pr skill`

### 2.7 `insights` (multi-op, keep infra)

- [ ] Create `skills/insights/SKILL.md` with dispatch (daily/weekly/catchup/view)
- [ ] `references/{daily,weekly,catchup,view}.md` — per-op detail
- [ ] Keep existing `collectors/`, `templates/`, `dashboard/` dirs untouched
- [ ] Absorb `commands/insights/{daily,weekly,catchup,view}.md`
- [ ] Delete `commands/insights/`
- [ ] Smoke: `/dev-flow:insights weekly`, `/dev-flow:insights view`
- [ ] Commit: `refactor(dev-flow): consolidate insights skill`

### 2.8 Cleanup `commands/` dir

- [ ] Verify `commands/` empty; if anything remains, migrate or delete
- [ ] `trash-put plugins/dev-flow/commands/`
- [ ] Verify `skills/spec/` removed (moved to user dotfiles)
- [ ] Commit: `chore(dev-flow): remove legacy commands directory`

## Phase 3 — Docs + Release

- [ ] Rewrite `plugins/dev-flow/README.md`:
  - 8-skill table with invocation examples (`/dev-flow:<name>`)
  - "Not included (personal)" section for `commit`, `spec`
  - Remove all `/df:*` references
- [ ] Update `README.md` (marketplace root) — dev-flow summary
- [ ] Update `CLAUDE.md` — any dev-flow examples
- [ ] Grep sanity:
  ```bash
  rg -n 'df:(review|commit|spec|triage|azdo|insights|ticket|branch)' plugins/dev-flow/ README.md CLAUDE.md
  rg -n '/df:' plugins/dev-flow/ README.md CLAUDE.md
  ```
  Both return zero (outside this spec/plan).
- [ ] Bump `plugins/dev-flow/.claude-plugin/plugin.json` → `3.0.0`
- [ ] Bump matching entry in `.claude-plugin/marketplace.json` → `3.0.0`
- [ ] Update `description`/`keywords` in both manifests if stale
- [ ] Commit: `docs(dev-flow): update for 3.0 consolidation`
- [ ] Commit: `chore(dev-flow): bump version to 3.0.0`

## Phase 4 — Install Test

- [ ] `/plugin uninstall dev-flow@lttr-claude-marketplace`
- [ ] `/plugin install dev-flow@lttr-claude-marketplace`
- [ ] Restart Claude Code
- [ ] Verify slash menu shows 8 `/dev-flow:*` entries
- [ ] Run one real task end-to-end (e.g. `/dev-flow:code-review` on a branch)

## Rollback

Each phase-2 step is its own commit. If one skill port breaks in production use, `git revert <sha>` restores that skill's prior state without touching others.
