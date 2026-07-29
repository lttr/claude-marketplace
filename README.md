# Claude Code Plugin Marketplace

I have extracted a couple of extensions for my Claude Code experience.

## Available Plugins

### CC Plugin

Claude Code authoring tools: scaffold plugins, skills, and commands, introspect Claude Code internals, and bridge work between sessions.

Everything ships as skills, all explicitly invoked (`/cc:<name>`) — none of them auto-trigger.

**Authoring:**

- `/cc:plugin-creator` - Plugin structure, `plugin.json`/`marketplace.json` manifests, version bumping, and marketplace publishing.
- `/cc:skill-creator` - SKILL.md authoring: frontmatter, trigger descriptions, progressive-disclosure references. Skills are the unified primitive — slash commands live as skills too.

**Introspection:**

- `/cc:list:builtin-tools` - Enumerate the built-in tools available in the current session (Read, Write, Bash, Grep, etc.) with descriptions, including ones hidden by `permissions.deny`.
- `/cc:list:hooks` - Show the hooks configured across user, project, and local settings files, so you can audit what's running on each event.
- `/cc:changelog` - Summarize recent Claude Code releases, scored by relevance to _your_ installed plugins, skills, and hook setup.

**Session handoff and memory hygiene:**

- `/cc:handoff` - Write `~/.claude/custom-handoff.md` (original prompt, goal, done, recent conclusions, next, watch-out) so a fresh Claude session can resume where this one stopped. Pass an optional focus argument (e.g. `/cc:handoff only what's left on the migration`) to bias the summary toward that thread. Load in a new session with `claude "@$HOME/.claude/custom-handoff.md"`.
- `/cc:memory-promote` - Audit this repo's auto-memory files and propose a durable home for each (user or repo `CLAUDE.md`, an existing/new skill, a `settings.json` hook), leaving genuinely ephemeral ones alone. Nothing moves without per-item confirmation.

**When to install:** you're building or tuning plugins/skills yourself, want a compact view of the features and hooks loaded into your session, run long tasks across multiple Claude sessions, or want to keep auto-memory from silently becoming your config.

**Installation:**

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install cc@lttr-claude-marketplace --scope local
```

See [plugins/cc/README.md](./plugins/cc/README.md) for detailed documentation.

### Dev Flow Plugin

Developer workflow automation: triage requirements, generate activity insights, and manage git workflows with Azure DevOps and Confluence integration.

**Skills (all `/df:<name>`):**

- `triage` - Assess requirement completeness (ticket id/URL, pasted text, .md path, or empty); tracker- and storage-agnostic
- `code-review-diff` - Read-only, pure git-native review of branch / staged / git ref / diff file
- `feature-branch` - Create `feature/<id>-<slug>` from AZDO ticket title
- `pr <op>` - `create` / `checkout <id>` / `list [mine|all]` / `complete`
- `pr-comments` - Read, assess, post AZDO PR thread comments
- `ticket <id> <state>` - Transition AZDO work item (active/cr/ready/closed)
- `insights <op>` - `daily` / `weekly` / `catchup` / `view` activity reports
- `az-cli` - NL-driven Azure DevOps CLI reference (model-invoked)

`commit` and `spec` are excluded by design — they reflect personal preferences and ship as user dotfiles.

**Installation:**

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install df@lttr-claude-marketplace --scope local
```

See [plugins/dev-flow/README.md](./plugins/dev-flow/README.md) for detailed documentation.

### AI Work (aiwork)

Repository-local `.aiwork/` folder convention for AI-assisted workflows, plus skills for the spec → tickets → implement workflow.

**Skills:**

- `aiwork-protocol` - Naming, frontmatter, and cross-reference standards for plans, specs, triage, reviews, and logs in `.aiwork/`
- `to-spec` - Turn a rough idea into a written spec
- `to-tickets` - Break a spec into implementable tickets
- `implement` - Work a ticket to completion
- `grill-with-docs` - Interrogate a design against docs, ADRs, and glossary
- `tdd` - Test-driven development: build features and fix bugs test-first
- `agent-browser` - Automate a real browser: open pages, snapshot elements, click/fill, extract content

**Used by:** dev-flow plugin (optional but recommended)

**Installation:**

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install aiwork@lttr-claude-marketplace --scope local
```

See [plugins/aiwork/README.md](./plugins/aiwork/README.md) for detailed documentation.

### Nuxt Plugin

Comprehensive Nuxt.js development guidance with Vue best practices, auto-imports awareness, and library-specific patterns.

> **Note:** this plugin is old and not actively maintained. Its reference docs have not been refreshed since early 2026, so parts may lag behind current Nuxt and module releases.

**Features:**

- Vue 3 composition API best practices
- Nuxt 3 auto-imports awareness (no manual imports needed)
- Pinia state management patterns
- VueUse composables integration
- Drizzle ORM with db0 support
- Nuxt UI, Nuxt Content, Nuxt Image, and Nuxt i18n guidance
- Tailwind CSS conventions

**Slash commands:**

- `/nuxt:prime:framework` - Load Nuxt framework patterns and conventions into context
- `/nuxt:prime:components` - Load Vue component patterns and best practices into context
- `/nuxt:upgrade:minor` - Upgrade Nuxt within the current major, fix issues, report what changed
- `/nuxt:upgrade:tsconfig` - Migrate tsconfig to Nuxt v4 project references structure

**Installation:**

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
claude plugin install nuxt@lttr-claude-marketplace --scope local
```

See [plugins/nuxt/README.md](./plugins/nuxt/README.md) for detailed documentation.

### Video to Article Plugin

Automated workflow for converting lecture videos into transcripts, outlines, and article drafts using ffmpeg and ElevenLabs API.

**Slash command:**

- `/video-to-article:process-video [youtube-url-or-folder-path]` - Run the full extract → transcribe → outline → draft pipeline

See [plugins/video-to-article/README.md](./plugins/video-to-article/README.md) for detailed documentation.

## Installation

### Add this marketplace

Clone this repo, then add it from the local checkout:

```shell
claude plugin marketplace add ~/code/claude-marketplace --scope local
```

Or straight from GitHub:

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
```

### Browse and install plugins

```shell
claude plugin list
```

Or install directly:

```shell
claude plugin install cc@lttr-claude-marketplace --scope local
claude plugin install df@lttr-claude-marketplace --scope local
claude plugin install nuxt@lttr-claude-marketplace --scope local
claude plugin install video-to-article@lttr-claude-marketplace --scope local
claude plugin install aiwork@lttr-claude-marketplace --scope local
```

## Deprecated Plugins

### Browser Tools (archived)

The `browser-tools` plugin has been deprecated and is no longer published through this marketplace. The source remains in [`_archived/browser-tools/`](./_archived/browser-tools) for reference.

Use `agent-browser` instead - CLI-driven browser automation with snapshot/click/fill by ref.

**Migration checklist** (if you were using `browser-tools`):

- Uninstall the plugin: `claude plugin uninstall browser-tools@lttr-claude-marketplace`
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
