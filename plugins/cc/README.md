# cc - Claude Code Authoring Plugin

Tools for creating and managing Claude Code plugins, skills, and commands, plus introspection utilities.

## Installation

```bash
/plugin marketplace add <marketplace-source>
/plugin install cc@<marketplace-name>
```

## Features

All functionality ships as skills. Skills marked **auto** may trigger from user intent; skills marked **explicit** only run when invoked directly (e.g. `/cc:changelog`).

### Authoring

- **plugin-creator** (auto) - Create and manage Claude Code plugins with proper structure, manifests, and marketplace integration
- **skill-creator** (auto) - Guide for creating skills (the unified primitive for both commands and auto-invoked capabilities), with the full frontmatter reference

### Introspection

- **cc:list:builtin-tools** (explicit) - List all built-in Claude Code tools
- **cc:list:hooks** (explicit) - List configured hooks
- **cc:changelog** (explicit) - Show recent Claude Code changes, ranked by relevance to your installed skills, commands, and usage patterns; keeps top 50% of items

### Session handoff

Claude Code has no native, lightweight way to start a follow-up session. The existing options are both costly: describing a bespoke markdown artifact is slow to write and slow to re-read, and running `/compact` is token-heavy and often loses the original intent. `/cc:handoff` fills that gap with a fixed-shape, ~200-word note at a stable path, loaded in one line at the start of the next session.

- **cc:handoff** (explicit) - Write `~/.claude/custom-handoff.md` so a fresh Claude session can resume current work. Load it in a new session with a small loader script that `exec`s `claude` with the file contents as the first prompt.

### Deprecated Commands

The following commands were removed in favor of native Claude Code alternatives:

| Removed command             | Use instead |
| --------------------------- | ----------- |
| `/cc:list:builtin-commands` | `/help`     |
| `/cc:list:custom-commands`  | `/skills`   |
| `/cc:list:custom-skills`    | `/skills`   |
| `/cc:list:builtin-agents`   | `/agents`   |
| `/cc:list:custom-agents`    | `/agents`   |
| `/cc:list:mcp-tools`        | `/mcp`      |
| `/cc:list:memory`           | `/memory`   |
| `/cc:list:plugins`          | `/plugin`   |

## Usage

### Creating a Plugin

Trigger the `plugin-creator` skill by asking:

- "Create a new plugin called my-plugin"
- "Add a command to my plugin"
- "Bump the version of my-plugin"

### Creating a Skill or Command

Skills are the unified primitive — slash commands live as skills now. Trigger the `skill-creator` skill by asking:

- "Create a new skill for PDF editing"
- "Help me build a skill for my BigQuery workflows"
- "Create a slash command to deploy to production"

## Built-in Agent Note

For questions about Claude Code features, CLI flags, or capabilities, use the built-in `claude-code-guide` agent via the Task tool - it fetches official documentation automatically.

## Development

See the plugin-creator skill's `references/` directory for detailed documentation on:

- Plugin structure and manifest schema
- Marketplace configuration
- Development workflows
