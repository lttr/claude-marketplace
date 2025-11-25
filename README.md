# Claude Code Plugin Marketplace

I have extracted a couple of extensions for my Claude Code experience.

## Available Plugins

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

### Browser Tools Plugin

Chrome DevTools Protocol automation for agent-assisted web testing and interaction. Lightweight alternative to MCP-based browser tools.

See [plugins/browser-tools/README.md](./plugins/browser-tools/README.md) for detailed documentation.

### Video to Article Plugin

Automated workflow for converting lecture videos into transcripts, outlines, and article drafts using ffmpeg and ElevenLabs API.

See [plugins/video-to-article/README.md](./plugins/video-to-article/README.md) for detailed documentation.

### Azure DevOps Plugin

Azure DevOps CLI guidance for managing repos, pipelines, boards, and projects using the `az` CLI.

**Features:**

- Most-used commands ready to run (list my PRs, my work items)
- Repository and PR management
- Pipeline runs and variables
- Work item queries with WIQL
- Project, team, and user management

**Installation:**

```shell
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install azure-devops@lttr-claude-marketplace
```

See [plugins/azure-devops/README.md](./plugins/azure-devops/README.md) for detailed documentation.

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
/plugin install nuxt@lttr-claude-marketplace
/plugin install browser-tools@lttr-claude-marketplace
/plugin install video-to-article@lttr-claude-marketplace
/plugin install azure-devops@lttr-claude-marketplace
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
