# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin marketplace** that hosts multiple plugins for distribution.

**Available plugins:**

- **nuxt** - Nuxt.js development guidance with Vue best practices
- **browser-tools** - Chrome automation for web testing via DevTools Protocol
- **video-to-article** - Convert lecture videos to transcripts and articles
- **dev-flow** - Developer workflow automation (triage, insights, Azure DevOps, git)
- **cc** - Claude Code authoring tools (plugins, skills, introspection)

## Repository Structure

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json     # Marketplace catalog listing all plugins
├── plugins/
│   ├── nuxt/                # Nuxt.js development guidance
│   ├── browser-tools/       # Chrome automation tools
│   ├── video-to-article/    # Video transcription workflow
│   ├── dev-flow/            # Developer workflow automation
│   └── cc/                  # Claude Code authoring tools
└── README.md                # Marketplace-level README
```

Each plugin contains `.claude-plugin/plugin.json`, optional `skills/`, `commands/`, and `README.md`.

## Marketplace vs Plugin Files

- **Marketplace manifest**: `.claude-plugin/marketplace.json` - Lists all available plugins with sources
- **Plugin manifest**: `plugins/*/​.claude-plugin/plugin.json` - Individual plugin metadata
- **Plugin components**: Each plugin has its own directory with skills/, commands/, agents/, etc.

## Skills to Load

When working with plugins or skills in this repository, proactively load:

- `plugin-creator` - For plugin structure, manifests, and marketplace changes
- `skill-creator` - For creating or modifying SKILL.md files

## Working with Plugins

### Adding a New Plugin

1. Create plugin directory: `plugins/your-plugin-name/`
2. Add plugin structure:
   ```
   plugins/your-plugin-name/
   ├── .claude-plugin/
   │   └── plugin.json       # Required: plugin metadata
   ├── skills/               # Optional: Agent Skills
   ├── commands/             # Optional: Slash commands
   ├── agents/               # Optional: Custom agents
   └── README.md             # Optional: Plugin docs
   ```
3. Update `.claude-plugin/marketplace.json` to include the new plugin entry
4. Ensure `source` field points to correct path: `"./plugins/your-plugin-name"`

### Editing Existing Plugins

#### Nuxt Plugin Structure

- **Main skill**: `plugins/nuxt/skills/nuxt/SKILL.md` - Quick reference with auto-import lists
- **Reference docs**: `plugins/nuxt/skills/nuxt/references/*.md` - Detailed library-specific patterns
- **Progressive disclosure**: References loaded on-demand to keep context efficient

#### Plugin Design Principles

1. **Dependency-Aware**: Check project files before suggesting library features
2. **Convention-Based**: Leverage framework conventions and directory structures
3. **Official Docs Integration**: Fetch from official sources when uncertain
4. **Minimal Context**: Keep skills focused to reduce token usage

## Git Workflow

Use conventional commits for all commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- Use `!` for breaking changes (e.g., `feat!:`, `fix!:`)

**Version bumping**: When making changes to a plugin, always update version in both:

1. `plugins/<plugin-name>/.claude-plugin/plugin.json`
2. `.claude-plugin/marketplace.json` (matching entry)

Use semantic versioning:

- Major (x.0.0): Breaking changes
- Minor (0.x.0): New features, command additions, refactoring
- Patch (0.0.x): Bug fixes, documentation only

## Claude Code Documentation References

### Plugin Development

- **[Plugins Guide](https://code.claude.com/docs/en/plugins.md)** - Plugin structure, development, testing
- **[Plugin Reference](https://code.claude.com/docs/en/plugins-reference.md)** - Manifest schema, directory structure
- **[Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces.md)** - Creating and distributing marketplaces
- **[Skills](https://code.claude.com/docs/en/skills.md)** - Building Agent Skills for plugins
- **[Slash Commands](https://code.claude.com/docs/en/slash-commands.md#plugin-commands)** - Command structure and naming

### Command Naming Convention

Commands use subdirectory-based namespacing by default:

- File: `commands/namespace/command.md` → Invoked as `/namespace:command`
- The `:` in invocation represents directory separator `/`
- Example: `commands/prime/vue.md` becomes `/prime:vue`

**Explicit naming**: Add `name:` in frontmatter to override path-based naming:

```yaml
---
name: df:commit
description: Create a git commit
---
```

This allows `/df:commit` even if file is at `commands/df/commit.md` in a `dev-flow` plugin (otherwise would be `/dev-flow:df:commit`).

## Installation & Testing

### Local Testing

```bash
/plugin marketplace add /path/to/claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
```

### After Publishing to GitHub

```bash
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
```

### Testing Plugin Changes

After modifying a plugin:

1. Uninstall: `/plugin uninstall plugin-name@marketplace-name`
2. Reinstall: `/plugin install plugin-name@marketplace-name`
3. Restart Claude Code to load changes

## Marketplace Schema

### Required Fields

- `name`: Marketplace identifier (kebab-case)
- `owner`: Maintainer information (name, email)
- `plugins`: Array of plugin entries

### Plugin Entry Fields

- `name`: Plugin identifier (must match plugin.json)
- `source`: Relative path from marketplace root (e.g., "./plugins/nuxt")
- `description`: Brief plugin description
- `version`: Plugin version
- `keywords`: Array of tags for discovery
- `category`: Plugin category (e.g., "framework", "productivity")

# Notes

- DO NOT use exact number of steps or similar references. The number might change and would be misleading in the future.
- DO NOT name a custom command and a skill with the same name, it might confuse Claude Code.
- **ALWAYS update README.md** when adding new plugins or making significant changes to reflect current state.
