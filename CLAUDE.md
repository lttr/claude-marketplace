# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code plugin** that provides specialized guidance for Nuxt.js development. The plugin includes a comprehensive Nuxt skill with Vue best practices, auto-import awareness, and library-specific patterns.

## Project Structure

```
.claude-plugin/
└── plugin.json          # Plugin metadata (name, version, description)

skills/nuxt/
├── SKILL.md            # Main skill file with quick reference and guidance
└── references/         # Detailed reference docs loaded on-demand
    ├── vue-best-practices.md
    ├── nuxt-patterns.md
    ├── pinia.md
    ├── vueuse.md
    ├── nuxt-modules.md
    └── drizzle-db0.md
```

## How This Plugin Works

1. **Plugin Definition**: `.claude-plugin/plugin.json` defines the plugin metadata
2. **Skill System**: The `skills/nuxt/` directory contains the skill that activates when users work on Nuxt projects
3. **Progressive Disclosure**: The main `SKILL.md` provides quick reference, while `references/` contain detailed docs loaded only when needed (efficient context usage)
4. **Dependency Detection**: The skill checks `package.json` to only show guidance for installed libraries

## Installation & Testing

### Local Testing
```bash
/plugin install nuxt@file:///home/lukas/code/nuxt-claude-plugin
```

### After Publishing to GitHub
```bash
/plugin install nuxt@yourusername/nuxt-claude-plugin
```

## Editing Skills

### Main Skill File
- **Path**: `skills/nuxt/SKILL.md`
- **Purpose**: Quick reference, auto-import lists, file conventions, and pointers to reference docs
- **Format**: YAML frontmatter with name/description, followed by markdown

### Reference Documentation
- **Path**: `skills/nuxt/references/*.md`
- **Purpose**: Detailed patterns for specific libraries or topics
- **Loading**: Only loaded when Claude needs them (keeps context efficient)
- **Dependencies**: Should check if library is installed before loading

## Key Design Principles

1. **Dependency-Aware**: Always check `package.json` before suggesting library-specific features
2. **Auto-Import Focused**: Never suggest manual imports for Nuxt/Vue auto-imported APIs
3. **File-Based Conventions**: Leverage Nuxt's directory structure (pages/, server/api/, etc.)
4. **Official Docs Integration**: Fetch from https://nuxt.com/llms.txt when uncertain
5. **Version Agnostic**: Support Nuxt 3+ without version-specific assumptions

## Skill Trigger Conditions

The Nuxt skill automatically activates when:
- Project has `nuxt` dependency in package.json
- Working with `.vue` files
- Working with `nuxt.config.ts`
- Files in Nuxt directories: `pages/`, `components/`, `server/`, `layouts/`, `middleware/`, `composables/`
