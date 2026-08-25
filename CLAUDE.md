This repository is a Claude Code plugin marketplace. The catalog is `.claude-plugin/marketplace.json`. Each plugin lives in `plugins/<name>/` with its own `.claude-plugin/plugin.json` and optional `skills/`, `commands/`, and `README.md`.

Plugins: **nuxt**, **video-to-article**, **dev-azdo** (Azure DevOps), **cc** (Claude Code authoring), **aiwork** (.aiwork/ protocol and the triage, spec, tickets, implement, review skills).

Deprecated plugins live in `_archived/` and are not listed in `marketplace.json`. Do not re-add them unless explicitly asked. `_archived/dev-flow/` (manifest name `df`) was split into `dev-azdo` and `aiwork`. Only its manifest and README remain.

## Rules

- **Version bumping**: any plugin change updates the version in both `plugins/<name>/.claude-plugin/plugin.json` and the matching entry in `.claude-plugin/marketplace.json`. Semver: major for breaking changes, minor for new features, commands, or refactoring, patch for fixes and docs.
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, with `!` for breaking changes.
- **Always update README.md** when adding plugins or making significant changes.
- Never state exact counts of steps or items in docs. They drift as things change.
- Never give a custom command and a skill the same name. It confuses Claude Code.
- When working on plugins or skills here, proactively load the `plugin-creator` and `skill-creator` skills.

## Paths in skills and commands

Use `${CLAUDE_SKILL_DIR}` for files in the skill's own directory and `${CLAUDE_PLUGIN_ROOT}` for other plugin files. Never use relative paths, they don't resolve.

## Command naming

The file `commands/foo/bar.md` becomes `/plugin-name:foo:bar`. A `name:` field in the frontmatter overrides path-based naming, so `name: my:commit` becomes `/my:commit`.

## Docs

Under https://code.claude.com/docs/en/ see `plugins.md`, `plugins-reference.md`, `plugin-marketplaces.md`, `skills.md`, and `slash-commands.md`.
