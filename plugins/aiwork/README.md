# aiwork

Convention for organizing AI work artifacts in a repository-local `.aiwork/` folder, with dated task folders and typed markdown files (triage, research, spec, plan, review, etc.), plus the skills for the full loop built on top of it: **intent → spec → tickets → implement → review**.

## Skills

- **aiwork-protocol** - The `.aiwork/` folder convention itself: task folders, epic folders that index areas, artifact types, naming, frontmatter
- **triage** - Assess requirement completeness (ticket id/URL, pasted text, `.md` path, or empty), explore code + docs, ask clarifying questions, write a report; tracker- and storage-agnostic
- **to-spec** - Turn the current conversation into a spec, saved per the aiwork protocol
- **to-tickets** - Break a plan, spec, or conversation into vertical-slice tickets with blocking edges
- **implement** - Implement a single ticket or a small inline change in one pass
- **implement-spec** - Implement a whole spec by orchestrating subagents over its ticket graph; auto-detects the most recent task folder
- **code-review-diff** - Read-only, pure git-native review of the current branch / staged changes / a git ref / a diff file
- **grill-with-docs** - Grilling session that challenges a plan against the domain model (glossary, ADRs) and updates the docs
- **tdd** - Test-driven development: build features and fix bugs test-first (red-green-refactor)
- **prototype** - Throwaway prototype answering one design question, plain HTML/CSS/JS in the task's `.aiwork/` folder by default, in-framework UI variants behind a `?variant=` switcher on a prototype branch when it must sit in the real app
- **wait-what** - One-word corrective when an explanation didn't land: re-pitch it in plain language using the project's glossary terms

The to-spec, to-tickets, implement, implement-spec, grill-with-docs, tdd, prototype, and wait-what skills are adaptations of skills from Matt Pocock's [skills](https://github.com/mattpocock/skills) collection.

The workflow skills reference the `aiwork-protocol` skill for folder and artifact conventions.

## The intent artifact

Work starts with an `intent.md`: what someone wants, in their own words, before anyone decides how. A sentence is enough. Its `status` tells a parked idea from an accepted one.

There is no skill for it. "Save my intent" and the `aiwork-protocol` skill do the rest. `/to-spec` answers it, and `/implement-spec` won't run until it is accepted.

## The verified-gate hook

`/implement` and `/implement-spec` end each ticket with passes only an agent can run: drive the app against the acceptance criteria, judge the UX, review the code. Tests and lint are deterministic and belong to the project's own pre-commit hook. This hook covers the rest: not whether the pass was done well, but whether it was done at all.

`hooks/hooks.json` registers `hooks/verified-gate.mjs` on `Stop` and `SubagentStop`. It scans tickets and review reports touched recently (uncommitted, or changed in `HEAD`) across every worktree of the repo, since implementer subagents work in their own. It holds the turn open (exit 2) when:

- a ticket is `status: done` and `verified:` has no on-app pass: `behaviour`, `ux` or `human`
- a ticket is `status: done` with acceptance criteria still unticked
- a `review*.md` has no `reviewed_sha:`, or names a commit unreachable from `HEAD`

It closes "claimed but never did it" and leaves the quality of the judgement to the pass itself. Because it lives in the plugin rather than a skill, a hand-edited ticket meets the same bar, and it reaches implementer subagents, which cannot carry hooks of their own. It honours `stop_hook_active`, so it never blocks twice on a condition the agent cannot resolve.

It needs only Node >= 24 and git. It fails open on anything it cannot determine: not a git repo, no `.aiwork/` folder.

## Model Invocation

Every workflow skill — `triage`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `code-review-diff`, `grill-with-docs`, `prototype`, `wait-what` — carries `disable-model-invocation: true`. They are deliberate steps you start yourself with `/aiwork:<name>`, not things that should auto-fire mid-conversation.

`aiwork-protocol` and `tdd` stay model-invocable: they are reference skills the model should pull in on its own when the situation calls for them.

`aiwork-protocol` and `triage` both trigger on the word "triage". The split: **`aiwork-protocol` decides where the artifact lands; `triage` decides what goes in it.**

## Artifact Output

`triage` and `code-review-diff` produce markdown and then ask where it goes — print, `/tmp`, or a path you name. Neither creates a folder unprompted. With `aiwork-protocol` present they follow the `.aiwork/` convention instead of asking. Pin a destination explicitly with `--out <path>`, or skip saving with `--print`.

## Optional Integrations

Neither `triage` nor `code-review-diff` requires anything beyond git.

- **Tracker fetch** (`triage`) — uses whichever tracker CLI or MCP server happens to be present (`az`, `gh`, Jira/Linear MCP). Nothing available → it asks you to paste the ticket text.
- **Docs search** (`triage`) — uses a connected Confluence/Notion MCP if there is one. The Atlassian MCP server ships with the `dev-azdo` plugin or comes from your own `~/.claude` config; without it, `triage` searches local docs only.
- **PR resolution** (`code-review-diff`) — the skill never checks anything out. Land on the right branch first, with `/dev-azdo:pr checkout <id>` if that plugin is installed, or plain `git` otherwise.

## Not Included (Personal)

`commit` and `spec` reflect personal preferences (commitlint shape, prettier hook, ticket extraction; spec template + sectioning). They ship as user dotfiles instead. To author your own:

```
~/.claude/skills/commit/SKILL.md
~/.claude/skills/spec/SKILL.md
```

When team conventions stabilize, add a project-local skill to override.

## Installation

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install aiwork@lttr-claude-marketplace --scope local
```
