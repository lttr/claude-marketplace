---
created: 2026-07-29
type: spec
status: draft
---

# Split dev-flow: Azure skills → `dev-azdo`, artifact skills → `aiwork`

## Goal

Retire the `df` plugin. Its 8 skills split along the line that actually divides them — dependency on the `az` CLI:

- 6 Azure DevOps skills → new **`dev-azdo`** plugin
- 2 platform-neutral artifact skills → existing **`aiwork`** plugin
- `plugins/dev-flow/` → `_archived/dev-flow/`, dropped from `marketplace.json`

## Rationale

`df` mixed two unrelated concerns: driving Azure DevOps, and producing markdown work artifacts. Installing it to get `triage` also pulled in four skills that are dead weight without an `az` login, and vice versa.

Splitting Azure out leaves `df` with two skills — too thin to justify a plugin. Folding those two into `aiwork` is not a consolation prize; the repo already says they belong there:

- `aiwork-protocol`'s artifact-type list already reserves **`triage` — problem framing, what's known** and **`review` — code review report**. The two skills produce exactly those types.
- `aiwork-protocol`'s frontmatter description already claims the trigger surface: _"triage, research a task, write a report, code review, summarize findings"_.
- `triage/references/sources.md` has a report-destination row reading _"An artifact-protocol skill is available → invoke it and let it decide the path"_ — a hopeful cross-plugin dependency that becomes reliable once co-located.
- The workflow chain closes inside one plugin: `triage → to-spec → to-tickets → implement → tdd → code-review-diff`. Today that loop straddles two plugins and breaks if you install only one.

Moving `feature-branch` into `dev-azdo` (rather than keeping it as a "mostly git" skill) also **reduces** total coupling — see the dependency audit.

## Skill Allocation

| Skill              | `az` coupling                                            | Destination |
| ------------------ | -------------------------------------------------------- | ----------- |
| `az-cli` (+4 refs) | total — it _is_ the az reference (1,606 lines)           | `dev-azdo`  |
| `pr` (+4 refs)     | total — `az repos pr` throughout                         | `dev-azdo`  |
| `pr-comments`      | total — `az devops invoke` threads API                   | `dev-azdo`  |
| `ticket`           | total — `az boards work-item update`                     | `dev-azdo`  |
| `feature-branch`   | `az boards work-item show` for the slug; rest is git     | `dev-azdo`  |
| `insights`         | 2 of 3 collectors are az; templates hardcode AZDO URLs   | `dev-azdo`  |
| `triage`           | none — tracker-agnostic via `references/sources.md`      | `aiwork`    |
| `code-review-diff` | none in the pipeline; one `az` snippet in a docs example | `aiwork`    |

### Why `insights` moves whole rather than splitting

Tempting to keep `insights` neutral and move only `collectors/azure-*.js`. Don't: `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PLUGIN_ROOT}` resolve within the owning plugin only, so no supported path lets an `aiwork` skill invoke a script living in `dev-azdo`. A split forces either path guessing or a duplicated collector. Two of three collectors and both report templates are Azure-shaped — move it intact, revisit if a second backend ever appears.

## End State

| Plugin                           | Skills                                                                              | Version |
| -------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| `dev-azdo` (new)                 | `az-cli`, `pr`, `pr-comments`, `ticket`, `feature-branch`, `insights` + `.mcp.json` | `1.0.0` |
| `aiwork`                         | + `triage`, `code-review-diff` (7 → 9)                                              | `3.3.0` |
| `dev-flow`                       | retired to `_archived/dev-flow/`, dropped from `marketplace.json`                   | —       |
| `nuxt`, `video-to-article`, `cc` | unchanged                                                                           | —       |

Marketplace stays at 5 published plugins.

### Versioning

Per repo convention (major = breaking, minor = new features):

- `aiwork` → **3.3.0**. Purely additive — two new skills, nothing in it breaks.
- `dev-azdo` → **1.0.0**.
- The breaking change is `/df:*` disappearing entirely; the marketplace removal records it. No `df` version bump — the plugin is archived, not released.

## Inter-Skill Dependency Audit

No `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PLUGIN_ROOT}` reference crosses a plugin boundary — verified; every one lives inside `insights`, which moves whole. All surviving inter-skill links are prose.

### Edges that become internal (coupling reduced)

| Edge                                                 | Kind                                      | Now internal to |
| ---------------------------------------------------- | ----------------------------------------- | --------------- |
| `feature-branch` → `ticket` (SKILL.md:69)            | **functional** — invokes it to set Active | `dev-azdo`      |
| `ticket` → `feature-branch` (SKILL.md:42)            | prose                                     | `dev-azdo`      |
| `pr` → `feature-branch` (SKILL.md:30, create.md:9)   | prose + error message                     | `dev-azdo`      |
| `triage` → `aiwork-protocol` (sources.md dest table) | **functional** — report destination       | `aiwork`        |

Moving `feature-branch` into `dev-azdo` is what makes the first three internal. Keeping it in the neutral plugin would have made all three cross-plugin, including a functional one.

### Edges that stay cross-plugin

| Edge                                                                    | Kind           | Handling                                                                                                                                                               |
| ----------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aiwork:triage` → `dev-azdo:az-cli` (sources.md:11)                     | **functional** | Already inside a detect-first table ending _"Nothing found → ask the user to paste"_. Reword to name `dev-azdo` as the source, if installed. Degrades correctly today. |
| `aiwork:triage` → `dev-azdo:ticket` (SKILL.md:191)                      | advisory       | reword                                                                                                                                                                 |
| `aiwork:code-review-diff` → `dev-azdo:pr checkout` (SKILL.md:131, :141) | advisory       | reword                                                                                                                                                                 |
| `dev-azdo:pr` → `aiwork:code-review-diff` (SKILL.md:33)                 | advisory       | reword, mark "if `aiwork` installed"                                                                                                                                   |

**Rule to enforce.** A cross-plugin reference may be advisory prose naming a skill, and must state its degradation. It may never be a script path or an unguarded functional invocation. All four comply after rewording.

## Decisions

### Plugin name: `dev-azdo`

Directory `plugins/dev-azdo/`, manifest name `dev-azdo`, slash paths `/dev-azdo:pr`. Note the asymmetry with the retiring plugin (directory `dev-flow`, manifest name `df`, slash `/df:`) — `dev-azdo` is spelled out in full deliberately.

### Keep the name `code-review-diff`

Symmetry with `to-spec` / `to-tickets` argues for `to-review`, and the artifact type it writes is `review.md`. But bare `review` collides with the built-in `/review` command, and CLAUDE.md forbids naming a command and a skill alike. `code-review-diff` is unambiguous and costs zero churn. Rejected: `to-review`, `review`.

### Both incoming skills stay model-invokable

aiwork's workflow skills (`to-spec`, `to-tickets`, `implement`, `grill-with-docs`) all carry `disable-model-invocation: true` — they are mid-workflow steps that shouldn't auto-fire. `triage` and `code-review-diff` are _entry points_ and their descriptions are written for model invocation. Deliberate divergence; document it in aiwork's README so it doesn't read as an oversight.

### Disambiguate `triage` vs `aiwork-protocol`

Both trigger on the word "triage" and will now sit in one plugin. Add a line to each: **`aiwork-protocol` decides where the artifact lands; `triage` decides what goes in it.** The ambiguity exists today across plugins — not a regression, but co-location makes it visible enough to fix.

### Atlassian MCP → `dev-azdo`

`.mcp.json` (Atlassian HTTP server) moves with `insights`, which uses it for Confluence page search. `triage` also lists Confluence in its docs-search table but is not tightly coupled: the table is detect-based and already ends _"Nothing connected → local docs only. Don't report an external search that didn't happen."_ With `aiwork` alone, `triage` silently drops to local docs. Add one line to `sources.md` noting the Atlassian server arrives via `dev-azdo` or the user's own `~/.claude` MCP config — documents the seam without creating a dependency.

### aiwork's scope widens

From ".aiwork/ folder protocol + spec→tickets→implement" to "the full loop: triage → spec → tickets → implement → review". This is a real identity change, not a file move — `plugin.json` description, `README.md`, and the marketplace entry all need rewriting. Precedent for hosting skills not bound to `.aiwork/` already exists there (`tdd`, `agent-browser`), and both incoming skills degrade to print / `/tmp` / ask when no `.aiwork/` is present.

## Edits Beyond the Moves

| File                                                                       | Change                                                                                                          |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| moved skills (all)                                                         | `/df:` → `/dev-azdo:` or `/aiwork:` in frontmatter descriptions and bodies                                      |
| `dev-azdo:pr/references/create.md:9`                                       | stale `/df:branch` → `/dev-azdo:feature-branch`                                                                 |
| `dev-azdo:pr/SKILL.md:33`                                                  | `code-review-diff` reference → cross-plugin wording with degradation                                            |
| `dev-azdo:feature-branch/SKILL.md`                                         | retarget `/df:feature-branch`, `/df:ticket`; keep the Azure framing (it's an AZDO plugin now)                   |
| `dev-azdo:insights` (catchup.md:48, view.md:16, dashboard/generate.ts:182) | `/df:insights` → `/dev-azdo:insights`                                                                           |
| `aiwork:triage/references/sources.md:11`                                   | name `dev-azdo` as `az-cli`'s source, if installed; add the Atlassian-MCP seam note                             |
| `aiwork:triage/SKILL.md:191`                                               | `df:ticket` → `dev-azdo:ticket`                                                                                 |
| `aiwork:triage/SKILL.md`, `aiwork-protocol/SKILL.md`                       | division-of-labor lines (where vs what)                                                                         |
| `aiwork:code-review-diff/SKILL.md:124,131,141`                             | `/df:code-review-diff` → `/aiwork:code-review-diff`; `df:pr` / `df:az-cli` → `dev-azdo:*`                       |
| `plugins/aiwork/.claude-plugin/plugin.json`                                | widened description, `+triage +code-review +review` keywords, `3.3.0`                                           |
| `plugins/aiwork/README.md`                                                 | 9-skill list, widened scope, model-invocation divergence note, carry over the "Not Included (Personal)" section |
| `plugins/dev-azdo/README.md`                                               | new — 6 skills, AZDO + Confluence dependencies, layout                                                          |
| `.claude-plugin/marketplace.json`                                          | add `dev-azdo` entry; edit `aiwork` entry; remove `df` entry                                                    |
| `README.md` (root)                                                         | replace the dev-flow section with dev-azdo; update the aiwork section                                           |
| `CLAUDE.md` (root)                                                         | plugin list, structure tree, `_archived/` note                                                                  |

Carry `dev-flow/README.md`'s **"Not Included (Personal)"** section (why `commit` and `spec` ship as user dotfiles rather than plugin skills) into `aiwork`'s README — it would otherwise be lost with the archived plugin.

## Steps

1. Create `plugins/dev-azdo/.claude-plugin/plugin.json` skeleton.
2. `git mv` the 6 Azure skill directories + `.mcp.json` into `plugins/dev-azdo/` (preserves history; copy+delete loses it).
3. `git mv` `triage` and `code-review-diff` into `plugins/aiwork/skills/`.
4. `git mv plugins/dev-flow _archived/dev-flow`.
5. Prefix rewrite across all moved skills.
6. Reword the 4 surviving cross-plugin edges with explicit degradation; fix the stale `/df:branch`.
7. Add the `triage` vs `aiwork-protocol` division-of-labor lines and the Atlassian-MCP seam note.
8. Version bumps in `plugin.json` + `marketplace.json` for both plugins; remove the `df` entry.
9. Documentation pass (table above).

### Commit sequence

```
feat(dev-azdo): add plugin skeleton
refactor(dev-azdo): move az-cli skill
refactor(dev-azdo): move pr skill
refactor(dev-azdo): move pr-comments skill
refactor(dev-azdo): move ticket skill
refactor(dev-azdo): move feature-branch skill
refactor(dev-azdo): move insights skill
refactor(dev-azdo): move atlassian mcp config
feat(aiwork): absorb triage and code-review-diff skills
fix: retarget cross-plugin skill references
chore!: archive dev-flow plugin
docs: update READMEs and CLAUDE.md for the split
chore: bump aiwork to 3.3.0, dev-azdo to 1.0.0
```

## Acceptance

- `rg '/df:' plugins/` returns nothing.
- `rg -n 'az |azure|Azure' plugins/aiwork` returns only `triage/references/sources.md`'s tracker-detection table and the reworded advisory lines in `code-review-diff`.
- No `${CLAUDE_SKILL_DIR}` / `${CLAUDE_PLUGIN_ROOT}` reference resolves outside its own plugin.
- `.claude-plugin/marketplace.json` lists 5 plugins, no `df`.
- Smoke: `/dev-azdo:pr list`, `/dev-azdo:feature-branch <id>` (incl. the `ticket` handoff), `/dev-azdo:insights daily`, `/aiwork:triage <id>` (AZDO fetch path _and_ paste fallback with `dev-azdo` uninstalled), `/aiwork:code-review-diff`.
- `aiwork` installed alone: `triage` degrades to paste-the-text and local-docs-only, no error.
- `dev-azdo` installed alone: `pr` advises rather than fails when `code-review-diff` is absent.
