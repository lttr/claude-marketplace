# Claude Code Plugin Marketplace

I have extracted a couple of extensions for my Claude Code experience.

## Available Plugins

### Browser Tools Plugin

Chrome DevTools Protocol automation for agent-assisted web testing and interaction. Lightweight alternative to MCP-based browser tools.

See [plugins/browser-tools/README.md](./plugins/browser-tools/README.md) for detailed documentation.

### CC Plugin

Claude Code authoring tools: create plugins, skills, commands, and introspect Claude Code internals.

**Features:**

- `plugin-creator` skill - Create and manage plugins with proper structure
- `skill-creator` skill - Guide for creating effective skills
- `/cc:list:builtin-tools` - List built-in tools
- `/cc:list:hooks` - List configured hooks
- `/cc:command:create` - Create new custom commands

**Installation:**

```shell
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install cc@lttr-claude-marketplace
```

See [plugins/cc/README.md](./plugins/cc/README.md) for detailed documentation.

### Dev Flow Plugin

Developer workflow automation: triage requirements, generate activity insights, and manage git workflows with Azure DevOps and Confluence integration.

**Features:**

- `/df:commit` - Git commit with commitlint format (`type(ticket#): msg`)
- `/df:review` - Code review current branch
- `/df:triage` - Analyze requirements against local codebase
- `/df:spec` - Generate implementation spec from triage output
- `/df:insights:daily`, `/df:insights:weekly` - Activity summaries from Git + Azure DevOps
- `/df:insights:view` - Interactive dashboard
- `/df:insights:catchup` - Download raw insights data
- `/df:azdo:pr` - Commit, push, create Azure DevOps PR in one step
- `/df:azdo:branch` - Create feature branch from ticket
- `/df:azdo:review` - Code review Azure DevOps PR
- `/df:azdo:triage <ticket-id>` - Triage Azure ticket with Confluence context
- `/df:azdo:ticket:start`, `/df:azdo:ticket:cr` - Work item state changes

**Installation:**

```shell
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install dev-flow@lttr-claude-marketplace
```

See [plugins/dev-flow/README.md](./plugins/dev-flow/README.md) for detailed documentation.

### AI Work Folder Protocol

Repository-local `.aiwork/` folder convention for AI-assisted workflows. Defines naming, frontmatter, and cross-reference standards for plans, specs, triage, reviews, and logs. Version control is optional.

**Used by:** dev-flow plugin (optional but recommended)

**Installation:**

```shell
/plugin install aiwork-folder-protocol@lttr-claude-marketplace
```

See [plugins/aiwork-folder-protocol/README.md](./plugins/aiwork-folder-protocol/README.md) for detailed documentation.

### Nuxt Plugin

Comprehensive Nuxt.js development guidance with Vue best practices, auto-imports awareness, and library-specific patterns.

**Features:**

- Vue 3 composition API best practices
- Nuxt 3 auto-imports awareness (no manual imports needed)
- Pinia state management patterns
- VueUse composables integration
- Drizzle ORM with db0 support
- Nuxt UI, Nuxt Content, Nuxt Image, and Nuxt i18n guidance
- Tailwind CSS conventions

**Installation:**

```shell
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
```

See [plugins/nuxt/README.md](./plugins/nuxt/README.md) for detailed documentation.

### Video to Article Plugin

Automated workflow for converting lecture videos into transcripts, outlines, and article drafts using ffmpeg and ElevenLabs API.

See [plugins/video-to-article/README.md](./plugins/video-to-article/README.md) for detailed documentation.

## Installation

### Add this marketplace

```shell
/plugin marketplace add lukastrumm/claude-marketplace
```

Or for local development:

```shell
/plugin marketplace add /path/to/claude-marketplace
```

### Browse and install plugins

```shell
/plugin
```

Select "Browse Plugins" to see available options, or install directly:

```shell
/plugin install browser-tools@lttr-claude-marketplace
/plugin install cc@lttr-claude-marketplace
/plugin install dev-flow@lttr-claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
/plugin install video-to-article@lttr-claude-marketplace
/plugin install aiwork-folder-protocol@lttr-claude-marketplace
```

## For Plugin Developers

To add your plugin to this marketplace:

1. Create your plugin in `plugins/your-plugin-name/`
2. Include `.claude-plugin/plugin.json` with plugin metadata
3. Add your plugin entry to `.claude-plugin/marketplace.json`
4. Submit a pull request

See [Claude Code Plugin Documentation](https://docs.claude.com/en/docs/claude-code/plugins) for plugin development guidance.

## License

MIT
