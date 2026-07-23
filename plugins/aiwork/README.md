# aiwork

Convention for organizing AI work artifacts in a repository-local `.aiwork/` folder, with dated task folders and typed markdown files (triage, research, spec, plan, review, etc.), plus skills for the workflow built on top of it.

## Skills

- **to-spec** - Turn the current conversation into a spec, saved per the aiwork protocol
- **to-tickets** - Break a plan, spec, or conversation into vertical-slice tickets with blocking edges
- **implement** - Implement work from a ticket, spec, or inline description; auto-detects the next item from the task folders
- **grill-with-docs** - Grilling session that challenges a plan against the domain model (glossary, ADRs) and updates the docs

The workflow skills are adaptations of skills from Matt Pocock's [skills](https://github.com/mattpocock/skills) collection.

## Protocol

The `.aiwork/` folder convention itself is described in [`aiwork-protocol.md`](./aiwork-protocol.md). The skills above reference it as the `aiwork-protocol` skill.

## Installation

```shell
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install aiwork@lttr-claude-marketplace
```
