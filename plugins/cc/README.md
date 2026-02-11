# cc - Claude Code Authoring Plugin

Tools for creating and managing Claude Code plugins, skills, and commands, plus introspection utilities.

## Installation

```bash
/plugin marketplace add <marketplace-source>
/plugin install cc@<marketplace-name>
```

## Features

### Skills

- **plugin-creator** - Create and manage Claude Code plugins with proper structure, manifests, and marketplace integration
- **skill-creator** - Guide for creating effective skills that extend Claude's capabilities

### Commands

**Introspection (`/cc:list:*`):**

- `/cc:list:builtin-tools` - List all built-in tools
- `/cc:list:hooks` - List configured hooks

**Authoring (`/cc:command:*`):**

- `/cc:command:create` - Create a new custom Claude Code command

### Deprecated Commands

The following commands were removed in favor of native Claude Code alternatives:

| Removed command | Use instead |
|---|---|
| `/cc:list:builtin-commands` | `/help` |
| `/cc:list:custom-commands` | `/skills` |
| `/cc:list:custom-skills` | `/skills` |
| `/cc:list:builtin-agents` | `/agents` |
| `/cc:list:custom-agents` | `/agents` |
| `/cc:list:mcp-tools` | `/mcp` |
| `/cc:list:memory` | `/memory` |
| `/cc:list:plugins` | `/plugin` |

## Usage

### Creating a Plugin

Trigger the `plugin-creator` skill by asking:

- "Create a new plugin called my-plugin"
- "Add a command to my plugin"
- "Bump the version of my-plugin"

### Creating a Skill

Trigger the `skill-creator` skill by asking:

- "Create a new skill for PDF editing"
- "Help me build a skill for my BigQuery workflows"

### Creating a Command

```bash
/cc:command:create deploy project "Deploy to production" "Bash"
```

## Built-in Agent Note

For questions about Claude Code features, CLI flags, or capabilities, use the built-in `claude-code-guide` agent via the Task tool - it fetches official documentation automatically.

## Development

See the plugin-creator skill's `references/` directory for detailed documentation on:

- Plugin structure and manifest schema
- Marketplace configuration
- Development workflows
