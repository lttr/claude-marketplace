# aiwork

Convention for organizing AI work artifacts in a repository-local `.aiwork/` folder, with dated task folders and typed markdown files (triage, research, spec, plan, review, etc.), plus the skills for the full loop built on top of it: **triage → spec → tickets → implement → review**.

## Skills

- **aiwork-protocol** - The `.aiwork/` folder convention itself: task folders, artifact types, naming, frontmatter
- **triage** - Assess requirement completeness (ticket id/URL, pasted text, `.md` path, or empty), explore code + docs, ask clarifying questions, write a report; tracker- and storage-agnostic
- **to-spec** - Turn the current conversation into a spec, saved per the aiwork protocol
- **to-tickets** - Break a plan, spec, or conversation into vertical-slice tickets with blocking edges
- **implement** - Implement work from a ticket, spec, or inline description; auto-detects the next item from the task folders
- **code-review-diff** - Read-only, pure git-native review of the current branch / staged changes / a git ref / a diff file
- **grill-with-docs** - Grilling session that challenges a plan against the domain model (glossary, ADRs) and updates the docs
- **tdd** - Test-driven development: build features and fix bugs test-first (red-green-refactor)
- **agent-browser** - Automate a real browser with the agent-browser CLI: open pages, snapshot elements, click/fill, extract content

The to-spec, to-tickets, implement, grill-with-docs, and tdd skills are adaptations of skills from Matt Pocock's [skills](https://github.com/mattpocock/skills) collection.

The workflow skills reference the `aiwork-protocol` skill for folder and artifact conventions.

## Model Invocation

`to-spec`, `to-tickets`, `implement`, and `grill-with-docs` carry `disable-model-invocation: true` — they are mid-workflow steps that shouldn't auto-fire.

`triage` and `code-review-diff` deliberately do **not**. They are entry points to the loop, and their descriptions are written to be matched by the model. This divergence is intentional, not an oversight.

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
