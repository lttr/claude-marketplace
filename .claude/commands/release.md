---
description: Format, bump version, commit and push plugin release
allowed-tools: Read, Edit, Bash(prettier --write .:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Glob
---

# Release Command

Automate plugin release workflow:

1. **Check for uncommitted changes** - if any exist, STOP and warn user to commit first
2. Run `prettier --write .` to format all files
3. **If prettier modified files** - commit them as `style: format with prettier`
4. Detect which plugin was modified since last version bump commit
5. Bump version (minor) in both:
   - `plugins/<plugin-name>/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json` (matching entry)
6. **Update README.md** - sync plugin descriptions, version numbers, and feature lists with current state
7. Commit version bump with conventional commit message
8. Push to remote

## Safety: Uncommitted Changes

If uncommitted changes exist before starting, STOP immediately. Those changes need their own commit (feat/fix) before release. Never lump forgotten work into version bump.

## Detection Logic

Look at git log to find:

- Files changed since last "feat:", "fix:", or "chore:" commit that touched version files
- Determine which plugin directory those changes belong to

## Version Bump Rules

- Use **minor** bump (0.x.0) by default for new features
- If commit messages mention "fix" only → **patch** (0.0.x)
- If breaking changes detected → ask user for confirmation on **major** (x.0.0)
