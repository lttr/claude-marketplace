---
description: Format, bump version, commit and push plugin release
allowed-tools: Read, Edit, Bash(prettier --write .:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Glob
---

# Release Command

Automate plugin release workflow:

1. Run `prettier --write .` to format all files
2. Detect which plugin was modified since last version bump commit
3. Bump version (minor) in both:
   - `plugins/<plugin-name>/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json` (matching entry)
4. Commit with conventional commit message
5. Push to remote

## Detection Logic

Look at git log to find:
- Files changed since last "feat:", "fix:", or "chore:" commit that touched version files
- Determine which plugin directory those changes belong to

## Version Bump Rules

- Use **minor** bump (0.x.0) by default for new features
- If commit messages mention "fix" only → **patch** (0.0.x)
- If breaking changes detected → ask user for confirmation on **major** (x.0.0)

## Commit Message Format

```
<type>: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Where `<type>` is inferred from changed files (feat/fix/docs/chore).
