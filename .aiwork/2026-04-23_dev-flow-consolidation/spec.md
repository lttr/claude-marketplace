---
created: 2026-04-23
type: spec
status: draft
---

# Dev-Flow Plugin Consolidation

## Goal

Collapse dev-flow plugin from **18 commands + 6 skills** to **8 skills, 0 commands**. All slash-invokable as `/dev-flow:<skill>`. NL-driven inputs, no rigid flags.

## Rationale

- Skills and commands converged in Claude Code — single primitive now.
- Real usage log (~3 months, `~/.claude/custom-skill-usage.log`) shows review variants drift (`code-review` 8, `azdo:review` 2, `review` 1) and most ticket/insights sub-ops unused.
- Thin CLI wrappers (7/18 commands) = noise.
- Duplicated logic: local vs azdo review, manual vs azdo triage.

## Final Skill List

| Skill         | Absorbs                                           | Input (NL)                                                        |
| ------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `code-review` | `review` + `azdo:review` + existing `code-review` | empty / PR# / PR URL / ticket URL→PR / diff path / `staged` / ref |
| `triage`      | `triage` + `azdo:triage` + existing `triage`      | ticket id/URL / pasted text / markdown path / empty               |
| `branch`      | `azdo:branch`                                     | ticket id/URL / `id slug-override` / empty                        |
| `pr`          | `azdo:pr:{create,checkout,list,complete}`         | "create" / "checkout 123" / "list [mine]" / "complete"            |
| `ticket`      | `azdo:ticket:{start,cr}`                          | "123 active" / "123 cr"                                           |
| `insights`    | `insights:{daily,weekly,catchup,view}` + existing | "daily" / "weekly [date]" / "catchup" / "view"                    |
| `az-cli`      | existing (unchanged)                              | NL azdo queries (model-invoked)                                   |
| `pr-comments` | existing `azdo-pr-comments`                       | PR id/URL / empty=current branch                                  |

## Excluded (Personal, Move to `~/.claude/skills/`)

- **`commit`** — commitlint format, prettier, ticket extraction, attribution, push behavior — too personal
- **`spec`** — template + sectioning reflect personal preference

Add "Not included" section to plugin README explaining these are easy to author once team conventions stabilize.

## Design Principles

1. **NL-parsed inputs, no flags** — skill body describes detection rules
2. **Ambiguous input → prompt user** rather than best-guess
3. **Clean separation** — `branch` and `pr` stay separate (branch happens first in dev flow)
4. **No internal skills** — all user-invocable for composability
5. **Progressive disclosure** — heavy docs in `references/<topic>.md`, loaded on demand

## Sub-op Dispatch

For multi-op skills (`pr`, `ticket`, `insights`):

- Dispatch logic in SKILL.md body — short switch on intent
- Per-op detail in `references/<op>.md` — loaded by Read when op picked
- Keeps SKILL.md lean, details lazy-loaded

## Cross-skill Composition

- `branch` does NOT auto-transition ticket — user calls `ticket` separately (clean separation)
- `pr create` errors if on main — tells user to run `branch` first
- `pr create` does NOT inline commit logic — tells user to commit first (since `commit` moved to personal)
- `code-review` is reusable pipeline — other skills can pass diff to it

## Migration Plan

1. Export current `commands/commit.md` logic + `commands/spec.md` + `skills/spec/` to user dotfiles for their personal `~/.claude/skills/{commit,spec}/`
2. Create 8 consolidated `skills/<name>/SKILL.md` files
3. Port logic from current commands into skill bodies
4. Move shared docs to `skills/<name>/references/`
5. Delete `commands/` directory entirely
6. Delete replaced skill dirs (`code-review`, `triage`, `insights`, `azdo-pr-comments`)
7. Update all docs (see Docs Update section)
8. Bump `plugins/dev-flow/.claude-plugin/plugin.json` + marketplace.json entry → **minor** bump (slash paths preserved, no user break)

## Docs Update

All references to old `/df:*` command paths must be replaced. Files to update:

| File                                          | Changes                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/dev-flow/README.md`                  | Rewrite skill list (8 skills), drop command sections, add "Not included" section (commit/spec), update invocation examples from `/df:x` to `/dev-flow:x` form |
| `plugins/dev-flow/.claude-plugin/plugin.json` | Update `description` if it mentions commands; bump `version`                                                                                                  |
| `README.md` (marketplace root)                | Update dev-flow plugin summary if it lists commands                                                                                                           |
| `CLAUDE.md` (project)                         | Update any dev-flow command references in examples / guidance                                                                                                 |
| `.claude-plugin/marketplace.json`             | Bump dev-flow `version`; update `description`/`keywords` if stale                                                                                             |
| Per-skill `SKILL.md`                          | Each mentions consolidated scope; cross-references use new names (`code-review` not `df:azdo:review`, etc.)                                                   |
| `skills/*/references/*.md`                    | Scrub for old path references                                                                                                                                 |

Grep check before PR:

```bash
rg -n 'df:(review|commit|spec|triage|azdo|insights)' plugins/dev-flow/ README.md CLAUDE.md
rg -n '/df:' plugins/dev-flow/ README.md CLAUDE.md
```

Both should return zero hits (except historical notes / changelog if any).

## File Moves (summary)

```
DELETE:
  commands/                                (entire dir)
  skills/code-review/                      (content → new skills/code-review/)
  skills/triage/                           (content → new skills/triage/)
  skills/insights/                         (content → new skills/insights/)
  skills/azdo-pr-comments/                 (content → new skills/pr-comments/)
  skills/spec/                             (export to user dotfiles, then delete)

CREATE:
  skills/code-review/SKILL.md              (+ existing pipeline content)
  skills/triage/SKILL.md                   (+ existing + azdo branch handling)
  skills/branch/SKILL.md
  skills/pr/SKILL.md                       (+ references/{create,checkout,list,complete}.md)
  skills/ticket/SKILL.md
  skills/insights/SKILL.md                 (+ existing collectors/templates/dashboard)
  skills/pr-comments/SKILL.md
  (az-cli unchanged)
```

## Success Criteria

- All `/dev-flow:<skill>` invocations work with NL arg
- Plugin README lists 8 skills + "Not included" section
- No references to removed `/df:*` paths anywhere
- Version bumped consistently in plugin.json + marketplace.json

## Unresolved Questions

1. `pr create` without prior commit — error + instruct, or inline minimal commit as fallback?
2. Should `branch` prompt to auto-transition ticket to Active, or stay clean-separated?
3. Keep `insights` collectors/dashboard infra given 1 real use, or trim aggressively?
4. `pr-comments` 0 real use — ship as helper or cut until demand appears?
5. Migration: one big commit, or staged commits per skill (easier revert)?
6. Version bump target — 2.5.0 (minor) acceptable given slash paths preserved?
7. Should `code-review` accept a pasted diff via stdin-like input, or only file paths / refs?
