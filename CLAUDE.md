# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin marketplace** that hosts multiple plugins for distribution. Currently contains the Nuxt plugin with comprehensive Nuxt.js development guidance.

## Repository Structure

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json     # Marketplace catalog listing all plugins
├── plugins/
│   └── nuxt/                # Individual plugin directories
│       ├── .claude-plugin/
│       │   └── plugin.json  # Plugin metadata
│       ├── skills/          # Plugin Skills
│       └── README.md        # Plugin documentation
└── README.md                # Marketplace-level README
```

## Marketplace vs Plugin Files

- **Marketplace manifest**: `.claude-plugin/marketplace.json` - Lists all available plugins with sources
- **Plugin manifest**: `plugins/*/​.claude-plugin/plugin.json` - Individual plugin metadata
- **Plugin components**: Each plugin has its own directory with skills/, commands/, agents/, etc.

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

#### Nuxt Plugin Design Principles

1. **Dependency-Aware**: Check `package.json` before suggesting library features
2. **Auto-Import Focused**: Never suggest manual imports for Nuxt/Vue auto-imported APIs
3. **File-Based Conventions**: Leverage Nuxt directory structure (pages/, server/api/, etc.)
4. **Official Docs Integration**: Fetch from https://nuxt.com/llms.txt when uncertain
5. **Version Agnostic**: Support Nuxt 3+ without version-specific assumptions

## Git Workflow

Use conventional commits for all commit messages:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- Use `!` for breaking changes (e.g., `feat!:`, `fix!:`)

## Installation & Testing

### Local Testing

```bash
/plugin marketplace add /path/to/claude-marketplace
/plugin install nuxt@claude-marketplace
```

### After Publishing to GitHub

```bash
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install nuxt@claude-marketplace
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

