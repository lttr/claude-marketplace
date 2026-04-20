# Claude Code Plugin Marketplace

I have extracted a couple of extensions for my Claude Code experience.

## Available Plugins

### CC Plugin

Claude Code authoring tools: scaffold plugins, skills, and commands, introspect Claude Code internals, and bridge work between sessions.

**Authoring skills** (auto-trigger from context):

- `plugin-creator` - Guides Claude through plugin structure, `plugin.json`/`marketplace.json` manifests, version bumping, and marketplace publishing. Triggers when editing a plugin manifest or creating a new plugin directory.
- `skill-creator` - Guides SKILL.md authoring: frontmatter, trigger descriptions, progressive-disclosure references. Triggers when creating or editing a skill.
- `changelog` - Summarizes recent Claude Code releases, scored by relevance to _your_ installed plugins, skills, and hook setup. Runs on demand.

**Slash commands:**

- `/cc:command:create <name> <scope> <description> [allowed-tools]` - Scaffold a new custom command with correct frontmatter and path conventions.
- `/cc:list:builtin-tools` - Enumerate the built-in tools available in the current session (Read, Write, Bash, Grep, etc.) with descriptions.
- `/cc:list:hooks` - Show the hooks configured across user, project, and local settings files, so you can audit what's running on each event.
- `/cc:handoff` - Write `~/.claude/custom-handoff.md` (original prompt, goal, done, next, watch-out) so a fresh Claude session can resume where this one stopped. Load in a new session with `claude "@$HOME/.claude/custom-handoff.md"`.

**When to install:** you're building or tuning plugins/skills yourself, want a compact view of the features and hooks loaded into your session, or run long tasks across multiple Claude sessions.

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
/plugin install cc@lttr-claude-marketplace
/plugin install dev-flow@lttr-claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
/plugin install video-to-article@lttr-claude-marketplace
/plugin install aiwork-folder-protocol@lttr-claude-marketplace
```

## Deprecated Plugins

### Browser Tools (archived)

The `browser-tools` plugin has been deprecated and is no longer published through this marketplace. The source remains in [`_archived/browser-tools/`](./_archived/browser-tools) for reference.

Use one of these alternatives instead:

- [`playwright-cli`](https://playwright.dev/docs/test-cli) skill - full-featured browser automation via Playwright
- An `agent-browser` style MCP/skill solution

**Migration checklist** (if you were using `browser-tools`):

- Uninstall the plugin: `/plugin uninstall browser-tools@lttr-claude-marketplace`
- Remove any `browser-tools` references from your global `~/.claude/CLAUDE.md` (or project `CLAUDE.md`) and point them at your replacement skill. Common places to check:
  - "Browser Usage" guidance that tells Claude to load `browser-tools` for UI testing, debugging, screenshots, or render verification
  - "Element picking" instructions that reference the `browser-pick` tool (e.g. "when I say 'let me pick an element'…")
- If `/tmp/chrome-profile-browser-tools` exists (created when running with `--profile`), remove it: `trash-put /tmp/chrome-profile-browser-tools`

## For Plugin Developers

To add your plugin to this marketplace:

1. Create your plugin in `plugins/your-plugin-name/`
2. Include `.claude-plugin/plugin.json` with plugin metadata
3. Add your plugin entry to `.claude-plugin/marketplace.json`
4. Submit a pull request

See [Claude Code Plugin Documentation](https://docs.claude.com/en/docs/claude-code/plugins) for plugin development guidance.

## License

MIT
