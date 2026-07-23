# aiwork

Convention for organizing AI work artifacts in a repository-local `.aiwork/` folder, with dated task folders and typed markdown files (triage, research, spec, plan, review, etc.), plus skills for the workflow built on top of it.

## Skills

- **aiwork-protocol** - The `.aiwork/` folder convention itself: task folders, artifact types, naming, frontmatter
- **to-spec** - Turn the current conversation into a spec, saved per the aiwork protocol
- **to-tickets** - Break a plan, spec, or conversation into vertical-slice tickets with blocking edges
- **implement** - Implement work from a ticket, spec, or inline description; auto-detects the next item from the task folders
- **grill-with-docs** - Grilling session that challenges a plan against the domain model (glossary, ADRs) and updates the docs
- **tdd** - Test-driven development: build features and fix bugs test-first (red-green-refactor)
- **agent-browser** - Automate a real browser with the agent-browser CLI: open pages, snapshot elements, click/fill, extract content

The to-spec, to-tickets, implement, grill-with-docs, and tdd skills are adaptations of skills from Matt Pocock's [skills](https://github.com/mattpocock/skills) collection.

The workflow skills reference the `aiwork-protocol` skill for folder and artifact conventions.

## Installation

```shell
/plugin marketplace add lttr/claude-marketplace
/plugin install aiwork@lttr-claude-marketplace
```
