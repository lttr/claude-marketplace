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
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install cc@lttr-claude-marketplace --scope local
```

See [plugins/cc/README.md](./plugins/cc/README.md) for detailed documentation.

### Maintenance Plugin

Repository upkeep: the chores that rot quietly if nobody runs them. Both skills report with evidence and never rewrite anything you did not ask them to.

- `/maintenance:docs-checker` - Audit context files (CLAUDE.md, `.claude/` tree, READMEs, docs): a bundled deterministic script checks links, assets, and backticked source paths against the working tree, then a bounded semantic pass flags verifiably stale content with evidence. Reports findings; fixes only on request.
- `/maintenance:dependency-update` - One dependency update run produces at most one reviewable PR. A deterministic scan script (pnpm or npm, workspace-aware) reports what is outdated and what is off-limits — exact pins, `catalog:` aliases, override workarounds are reported and never bumped — plus packages installed at two or more majors. The skill then reads release notes where they pay off, batches only majors whose breaking changes it can prove do not touch the codebase, verifies with the project's own gate, and ends every PR with a mandatory "Not verified" section. Pass `dry-run` for a read-only report. It carries no project specifics: a repo with real toolchain constraints writes a local skill that wraps it.

**When to install:** you want docs that keep pointing at real files, and a dependency update you can actually review instead of rubber-stamping.

**Installation:**

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install maintenance@lttr-claude-marketplace --scope local
```

See [plugins/maintenance/README.md](./plugins/maintenance/README.md) for detailed documentation.

### Dev Azure DevOps Plugin

Azure DevOps workflow automation: read, create and comment on work items and move them between states, branch off a ticket, drive pull requests and their comment threads.

**Skills (all `/dev-azdo:<name>`):**

- `ticket <op> <id>` - `show` / `create` / `comment` / `state` on a work item. Descriptions and comments render as Markdown
- `feature-branch` - Create `feature/<id>-<slug>` from AZDO ticket title
- `pr <op>` - `create` / `checkout <id>` / `list [mine|all]` / `complete` (slash-only)
- `pr-comments` - Read, assess, post AZDO PR thread comments

Every skill here needs the Azure CLI with the `azure-devops` extension. The platform-neutral artifact skills that used to sit alongside them — `triage` and `code-review-diff` — now live in `aiwork`.

**Installation:**

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install dev-azdo@lttr-claude-marketplace --scope local
```

See [plugins/dev-azdo/README.md](./plugins/dev-azdo/README.md) for detailed documentation.

### Confluence Plugin

The Atlassian MCP server plus the `wiki-map` skill. Installing it connects the hosted HTTP server (`https://mcp.atlassian.com/v1/mcp`, OAuth on first use), and any skill that looks for connected doc sources picks the tools up. `aiwork:triage` does, in its research step.

`wiki-map` keeps a durable map of the connected site — the main spaces, the page under which current work lives, direct links — and finds the user's personal space, so Claude knows where something is documented and where a new page belongs before it starts searching. Anything that changes, like team lists or activity, it queries live. It also flags stale content.

It used to ship inside `dev-azdo`.

**Installation:**

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install confluence@lttr-claude-marketplace --scope local
```

See [plugins/confluence/README.md](./plugins/confluence/README.md) for detailed documentation.

### AI Work (aiwork)

Repository-local `.aiwork/` folder convention for AI-assisted workflows, plus the skills for the full loop: intent → spec → tickets → implement → review.

**Skills:**

- `aiwork-protocol` - Naming, frontmatter, epic/area structure, and cross-reference standards for intents, plans, specs, triage, reviews, and logs in `.aiwork/`
- `triage` - Assess requirement completeness (ticket id/URL, pasted text, `.md` path, or empty); tracker- and storage-agnostic
- `to-spec` - Turn a rough idea into a written spec
- `to-tickets` - Break a spec into implementable tickets
- `implement` - Work a single ticket or small inline change to completion in one pass
- `implement-spec` - Implement a whole spec by orchestrating subagents over its ticket graph
- `next-steps` - Read-only status overview of a task folder: ticket frontier, spec status, what awaits the human, and the next slash command
- `code-review-diff` - Read-only, pure git-native review of branch / staged / git ref / diff file
- `grill-with-docs` - Interrogate a design against docs, ADRs, and glossary
- `tdd` - Test-driven development: build features and fix bugs test-first
- `prototype` - Throwaway prototype answering one design question, plain HTML in the task's `.aiwork/` folder by default, in-app UI variants on a prototype branch when needed
- `wait-what` - Re-pitch an explanation that didn't land, in plain language and glossary terms

**Hooks:**

- `verified-gate` - Holds a stop when an `.aiwork/` ticket claims `done` without evidence of an on-app pass (`behaviour`, `ux` or `human` in `verified:`, ticked acceptance criteria) or a review lacks `reviewed_sha:`. Fails open

**Scripts:**

- `bootstrap-worktree.sh` - Copies the gitignored files `.worktreeinclude` matches and runs the project's session-bootstrap hook in a manually created worktree; `implement-spec` uses it for task and ticket worktrees

`commit` and `spec` are excluded by design — they reflect personal preferences and ship as user dotfiles.

**Pairs with:** `dev-azdo` (optional) — gives `triage` an Azure DevOps fetch path and `code-review-diff` a PR checkout. Both degrade cleanly without it.

**Installation:**

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install aiwork@lttr-claude-marketplace --scope local
```

See [plugins/aiwork/README.md](./plugins/aiwork/README.md) for detailed documentation.

### Browser Plugin

Browser automation for agents, built on the `playwright-cli` CLI ([`@playwright/cli`](https://www.npmjs.com/package/@playwright/cli)). Everything that depends on the browser-driving CLI lives here, so a future CLI swap touches one plugin.

**Skills:**

- `playwright-cli` - Drive a real browser: open pages, snapshot elements, click/fill by ref, evaluate JS, screenshot. The official `@playwright/cli` skill, vendored (model-invoked)
- `/browser:showme` - Drive a headed browser to a described app state, verify it, then leave the window open for the user with a note on what to try
- `page-bridge` - Inject a floating "agent" toolbar into a running dev page; the user picks elements, comments on them, or sends notes that arrive as live agent notifications
- `/browser:pick [prompt]` - One-shot element picker over CDP: returns the CSS selector, tag, classes, and text of what the user clicks; starts the dev server if needed

Needs `playwright-cli` on PATH (`npm i -g @playwright/cli`, not installed by the plugin), a browser it can launch (system Chrome, or `playwright-cli install-browser --with-deps` once), and Node >= 24 for `page-bridge`. Every skill runs a preflight check first and tells you exactly what is missing. The preflight also points `playwright-cli` at a global output directory, so snapshots and traces never land in the project you are working in.

**Installation:**

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install browser@lttr-claude-marketplace --scope local
```

See [plugins/browser/README.md](./plugins/browser/README.md) for detailed documentation.

### Writing Plugin

Skills for producing text that is easy to read, plus a linter that checks drafts before they ship.

**Skills:**

- `wr` - Rules for clear English prose in docs, notes, summaries, README sections, and chat answers. Ships `check-prose.ts`, a heuristic linter the skill runs on every draft (model-invoked)
- `czech-typography` - Czech typography for the web: punctuation, dash vs. hyphen, quotes, numbers, units, non-breaking spaces, HTML entities (model-invoked)
- `/writing:fix-grammar <file>` - Fix typos and grammar in a file. Syntax errors only, no editorial or style changes
- `/writing:tldr` - Rewrite the previous response as its leanest version, three sentences or bullets at most

`fix-grammar` and `tldr` are manual by design: both act on a target you name, so automatic invocation would be wrong.

The linter reports at three levels. ERROR covers blacklisted phrases, em-dash splices, emoji and exclamation marks, and always gets fixed. WARN covers long sentences, oversized paragraphs, flat rhythm, staged reveals, repeated sentence openers and the negation and colon-list tells, to fix when the flagged text really is hard to read. INFO is statistics, passive-voice hints and ordinary colon lists. It runs under Node with native TypeScript stripping, so it needs Node 22.6 or newer.

`my-writing-style` is excluded by design: it encodes one person's voice and stays in user dotfiles.

**Installation:**

```shell
claude plugin marketplace add lttr/claude-marketplace --scope local
claude plugin install writing@lttr-claude-marketplace --scope local
```

See [plugins/writing/README.md](./plugins/writing/README.md) for detailed documentation.

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
claude plugin marketplace add lttr/claude-marketplace --scope local
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
claude plugin install dev-azdo@lttr-claude-marketplace --scope local
claude plugin install nuxt@lttr-claude-marketplace --scope local
claude plugin install video-to-article@lttr-claude-marketplace --scope local
claude plugin install aiwork@lttr-claude-marketplace --scope local
claude plugin install browser@lttr-claude-marketplace --scope local
claude plugin install writing@lttr-claude-marketplace --scope local
```

## Deprecated Plugins

### Dev Flow / `df` (archived)

The `df` plugin has been split along the line that actually divided it — dependency on the `az` CLI — and is no longer published. The source remains in [`_archived/dev-flow/`](./_archived/dev-flow) for reference.

**Migration checklist:**

- Uninstall it: `claude plugin uninstall df@lttr-claude-marketplace`
- Install the replacements you actually need: `dev-azdo` for the Azure DevOps skills, `aiwork` for `triage` and `code-review-diff`
- Retarget invocations in your `CLAUDE.md`, scripts, and shell wrappers:

| Was                    | Now                        |
| ---------------------- | -------------------------- |
| `/df:feature-branch`   | `/dev-azdo:feature-branch` |
| `/df:pr`               | `/dev-azdo:pr`             |
| `/df:pr-comments`      | `/dev-azdo:pr-comments`    |
| `/df:ticket`           | `/dev-azdo:ticket state`   |
| `/df:insights`         | removed in `dev-azdo` 2.0  |
| `/df:triage`           | `/aiwork:triage`           |
| `/df:code-review-diff` | `/aiwork:code-review-diff` |

The Atlassian MCP server, which `dev-flow` carried, now lives in the `confluence` plugin. Without it, `triage` searches local docs only.

### Browser Tools (archived)

The `browser-tools` plugin has been deprecated and is no longer published through this marketplace. The source remains in [`_archived/browser-tools/`](./_archived/browser-tools) for reference.

Use the `browser` plugin instead - CLI-driven browser automation on top of `playwright-cli`, with snapshot/click/fill by ref, a headed hand-off skill, a page feedback toolbar, and an element picker (`/browser:pick` replaces `browser-pick`).

**Migration checklist** (if you were using `browser-tools`):

- Uninstall the plugin: `claude plugin uninstall browser-tools@lttr-claude-marketplace`
- Remove any `browser-tools` references from your global `~/.claude/CLAUDE.md` (or project `CLAUDE.md`) and point them at the `browser` plugin's skills. Common places to check:
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
