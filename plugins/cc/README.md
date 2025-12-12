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

- `/cc:list:builtin-commands` - List all built-in Claude Code slash commands
- `/cc:list:builtin-agents` - List all Task tool subagent types
- `/cc:list:builtin-tools` - List all built-in tools
- `/cc:list:custom-commands` - List available custom commands
- `/cc:list:custom-agents` - List custom agents
- `/cc:list:custom-skills` - List available skills
- `/cc:list:mcp-tools` - List MCP server tools
- `/cc:list:hooks` - List configured hooks
- `/cc:list:plugins` - List installed plugins
- `/cc:list:memory` - List memory files

**Authoring (`/cc:command:*`):**

- `/cc:command:create` - Create a new custom Claude Code command

## Usage

### Creating a Plugin

Trigger the `plugin-creator` skill by asking:

- "Create a new plugin called my-plugin"
- "Add a command to my plugin"
- "Bump the version of my-plugin"

Or use the automation scripts directly:

```bash
# Create plugin structure
python scripts/create_plugin.py my-plugin \
  --marketplace-root /path/to/marketplace \
  --author-name "Your Name" \
  --author-email "email@example.com" \
  --description "Plugin description" \
  --keywords "keyword1,keyword2"

# Bump version
python scripts/bump_version.py my-plugin minor \
  --marketplace-root /path/to/marketplace
```

### Creating a Skill

Trigger the `skill-creator` skill by asking:

- "Create a new skill for PDF editing"
- "Help me build a skill for my BigQuery workflows"

Or initialize directly:

```bash
python scripts/init_skill.py my-skill --path ~/.claude/skills/
```

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
