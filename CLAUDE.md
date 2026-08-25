This repository is a Claude Code plugin marketplace. The catalog is `.claude-plugin/marketplace.json`. Each plugin lives in `plugins/<name>/` with its own `.claude-plugin/plugin.json` and optional `skills/`, `commands/`, and `README.md`.

Plugins: **nuxt**, **video-to-article**, **dev-azdo** (Azure DevOps), **cc** (Claude Code authoring), **aiwork** (.aiwork/ protocol and the triage, spec, tickets, implement, review skills).

Deprecated plugins live in `_archived/` and are not listed in `marketplace.json`. Do not re-add them unless explicitly asked. `_archived/dev-flow/` (manifest name `df`) was split into `dev-azdo` and `aiwork`. Only its manifest and README remain.

## Rules

- **Versioning and releases** are handled by the `/release` command. Don't bump plugin versions in feature or fix commits.
- **Always update README.md** when adding plugins or making significant changes.
- Never state exact counts of steps or items in docs. They drift as things change.
- Never give a custom command and a skill the same name. It confuses Claude Code.
- When working on plugins or skills here, proactively load the `plugin-creator` and `skill-creator` skills.

## Useful facts from the docs

- Paths: use `${CLAUDE_SKILL_DIR}` for files in the skill's own directory and `${CLAUDE_PLUGIN_ROOT}` for other plugin files. Never use relative paths, they don't resolve.
- Command naming: `commands/foo/bar.md` becomes `/plugin-name:foo:bar`. A `name:` frontmatter field is ignored in command files. In plugin skills it replaces the last segment of the command, so `skills/review/SKILL.md` with `name: fancy` becomes `/plugin-name:fancy`.
- Reference docs under https://code.claude.com/docs/en/: `plugins.md`, `plugins-reference.md`, `plugin-marketplaces.md`, `skills.md`, `slash-commands.md`.
