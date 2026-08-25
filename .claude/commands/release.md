---
description: Format, bump version, commit and push plugin release. Ship it.
allowed-tools: Read, Edit, Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Glob
---

# Release Command

Automate the plugin release workflow:

1. Check for uncommitted changes. If any exist, stop and tell the user to commit them first. Forgotten work needs its own feat or fix commit and must never be lumped into the version bump.
2. Detect which plugin changed. Look at the git log for files changed since the last commit that touched version files, and determine which plugin directory those changes belong to.
3. Bump the version in both `plugins/<plugin-name>/.claude-plugin/plugin.json` and the matching entry in `.claude-plugin/marketplace.json`.
4. Update README.md: sync plugin descriptions, version numbers, and feature lists with the current state.
5. Commit the version bump with a conventional commit message.
6. Push to remote.

## Version Bump Rules

- Minor (0.x.0) for new features, commands, or refactoring. This is the default.
- Patch (0.0.x) when the commits are only fixes or docs.
- Major (x.0.0) for breaking changes: ask the user to confirm first.
