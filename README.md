# Claude Code Plugin Marketplace

A curated collection of Claude Code plugins for modern web development.

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
/plugin install nuxt@claude-marketplace
```

See [plugins/nuxt/README.md](./plugins/nuxt/README.md) for detailed documentation.

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

Select "Browse Plugins" to see available options.

## For Plugin Developers

To add your plugin to this marketplace:

1. Create your plugin in `plugins/your-plugin-name/`
2. Include `.claude-plugin/plugin.json` with plugin metadata
3. Add your plugin entry to `.claude-plugin/marketplace.json`
4. Submit a pull request

See [Claude Code Plugin Documentation](https://docs.claude.com/en/docs/claude-code/plugins) for plugin development guidance.

## License

MIT
