---
name: code-review
description: Review code changes from the current branch, staged changes, a git ref, or a diff/patch file. Pure git-native — no platform/PR awareness. Trigger when user says "review this", "code review", "/df:code-review", or provides a git ref or diff path. Read-only — never posts comments.
---

# Code Review

Pure git-native review pipeline. Resolves a diff from git-native inputs, runs the review pipeline, and produces a markdown report.

**Does NOT** check out branches, talk to Azure DevOps / GitHub, or post comments. PR resolution is the caller's job (see Usage).

## Arguments

`$ARGUMENTS` is a space-separated string. Parse out optional flags first, then treat the remainder as the diff source.

| Flag             | Meaning                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `--rules <path>` | Path to a project rules markdown file. User-passed value WINS over any wrapper-pinned `rules_file`. |
| `--print`        | Non-interactive mode: print review to stdout, do not prompt for save destination.                   |

A wrapper skill may pre-set `rules_file` (a single path) before invoking this skill — treat it as the default when `--rules` is absent.

## Input Detection

After flags are stripped, the remainder selects the diff source:

| Form                            | Source                                |
| ------------------------------- | ------------------------------------- |
| empty                           | current branch vs base (master/main)  |
| `staged`                        | `git diff --staged`                   |
| path ending `.diff` or `.patch` | local diff file                       |
| anything else                   | treat as git ref (branch / sha / tag) |

Ambiguous → ask user. Do NOT guess. **Never** treat a numeric value as a PR id — this skill has no platform awareness.

## Workflow

### 1. Resolve input → diff file path + metadata

#### empty

```bash
base=$(git rev-parse --verify master 2>/dev/null && echo master || echo main)
cur=$(git branch --show-current)
[ "$cur" = "$base" ] && abort "On base branch ($base). Switch to a feature branch."
git diff "$base"...HEAD > "/tmp/review-diff-$(date +%s).diff"
files=$(git diff --name-only "$base"...HEAD)
title="$cur"
slug="$cur"
```

#### `staged`

```bash
git diff --staged > "/tmp/review-diff-staged-$(date +%s).diff"
files=$(git diff --staged --name-only)
title="staged changes"
slug="staged"
```

#### `.diff` / `.patch` path

Use file as-is. Parse changed files from diff headers (`+++ b/...`).
`slug="$(date +%s)"`.

#### git ref

```bash
git diff "<ref>"...HEAD > "/tmp/review-diff-ref-$(date +%s).diff"
files=$(git diff --name-only "<ref>"...HEAD)
title="HEAD vs <ref>"
slug="$(git branch --show-current)"
```

### 2. Diff size guard

```bash
n=$(wc -l < <(echo "$files"))
```

If `n > 50` → warn user, ask: proceed full / filter to paths / abort.

### 3. Run pipeline

Read `references/pipeline.md` and **execute every phase**. The phase sequence, the lens set chosen by Step 1.4 (kind routing), the scoring pass, and the final Critical/Concerns/Nits format are mandatory — no shortcut to a freeform review, regardless of how small the diff looks. Inline vs. Task-tool fan-out is a perf choice (threshold + kind routing defined in `pipeline.md`); the contract is the steps and the output.

Inputs to pass through:

- `DIFF_FILE` = path from step 1
- `CHANGED_FILES` = list from step 1
- `TITLE` = title from step 1
- `RULES_FILE` = resolved rules path (`--rules` over wrapper-pinned; may be unset)

### 4. Output

Hold the rendered markdown review in memory. Then choose destination:

- If `--print` is set: print the markdown to stdout. Done.
- Otherwise, ask the user:
  1. Print only (no save) — default
  2. Save to `/tmp/review-<slug>.md`
  3. Other path

Skill produces markdown and stops. Sending it to a PR, a chat, or anywhere else is a follow-up the user runs themselves — this skill never invokes other skills or posts to forges.

## Usage

### Recommended: shell wrapper + worktree (non-destructive)

Run from terminal. Resolve PR id → source branch via platform CLI, then launch Claude in a worktree pinned to that branch. Keeps the user's main working tree untouched.

```bash
#!/usr/bin/env bash
# bin/cr-pr <pr-id>
PR_ID=$1
BRANCH=$(az repos pr show --id "$PR_ID" --query sourceRefName -o tsv | sed 's|refs/heads/||')
claude --worktree "$BRANCH" "/df:code-review --rules .claude/code-review-rules.md"
```

Replace `az repos pr show` with `gh pr view --json headRefName` for GitHub.

### In-session: check out first

Land on the PR's source branch first (e.g. `/df:pr checkout <id>` for Azure DevOps), then invoke `/df:code-review`. The skill reviews the current branch vs base.

### Warning

This skill never checks anything out. Whatever is in cwd is what gets reviewed. If you want PR context but are on the wrong branch, the diff will reflect the wrong starting point.

## Notes

- Read-only. Never posts PR comments. For comments use `pr-comments` skill.
- Pipeline detail lives in `references/pipeline.md` — load only when running review.
- No `az`, no `gh`, no PR-id resolution. PR resolution lives in `df:pr`, `df:az-cli`, or shell wrappers.
