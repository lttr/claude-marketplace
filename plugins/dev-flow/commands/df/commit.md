---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Bash(git show:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git push:*)
description: Create a git commit with intelligent message generation
argument-hint: [commit message] [push] [all]
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`
- Current diff: !`git diff HEAD`

## Task

Commit files modified by Claude (via Edit/MultiEdit/Write) in this conversation.

**Arguments (`$ARGUMENTS`):**

- Text (excluding "push"/"all") → use as commit message guidance
- `push` → push after committing
- `all` → commit all changes, not just Claude-modified files

**Pre-staged files:**

Check `git diff --cached --name-only`. If any staged files weren't modified by Claude, warn user and ask: (a) include them, (b) unstage them, or (c) abort.

**Attribution check:**

If `.claude/settings.json` or `.claude/settings.local.json` in project root doesn't have `"attributionEnabled": true`, warn user that commit attribution is disabled.

## Commit Message Format

Follow commitlint convention: `type(ticket#): message`

**Types:** feat, fix, chore, docs, refactor, perf, test, build, ci, revert

**Scope:** Numeric ticket number only (from branch name, conversation context, or ask user)

**Breaking changes:** Append `!` after scope: `feat(123)!: message`

**Good examples:**

```
fix(192108): fix of translations
feat(189212): added border styles to banner component
chore(191659): disable NewRelic
feat(185869): remove old pl-related configs
feat(64683)!: migration on nuxt bridge
```

**Bad examples (avoid these):**

```
WIP                              # no type/scope
191584                           # just ticket number
Hidden internal reviews          # no type/ticket
feat(hotfix): fix env config     # non-numeric scope
bug(190910): fix translations    # invalid type
```

## Workflow

1. Identify Claude-modified files from conversation (or all files if `$ARGUMENTS` contains "all")
2. If no files to commit, inform user
3. Record `git rev-parse HEAD`
4. Extract ticket number from branch name (e.g., `feature/12345-desc` → `12345`)
5. Split into multiple commits if changes are unrelated
6. Stage with `git add <files>` and commit (file-level staging includes others' changes to same file)
7. Show summary: `git log --oneline` from recorded HEAD
8. Push if "push" in `$ARGUMENTS`

Execute git commands in parallel where possible. Output only the first line of commit message(s).
