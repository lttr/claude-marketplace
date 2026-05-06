---
name: cc:changelog
description: Show recent Claude Code changes personalized to user's setup. Trigger when user asks about changelog, "what's new", "cc changelog", "claude code updates", "recent changes", or wants to know what changed in Claude Code.
disable-model-invocation: true
allowed-tools: Bash(deno:*), Bash(chmod:*)
---

# CC Changelog

Show recent Claude Code changes, scored by relevance to the user's installed skills, commands, plugins, hooks, and usage patterns.

## Workflow

1. Run the data collection script:

```bash
${CLAUDE_SKILL_DIR}/scripts/cc-changelog.ts 2>/dev/null
```

To force a date-based lookback (ignoring lastVersion state), pass `--lookback-days=N`:

```bash
${CLAUDE_SKILL_DIR}/scripts/cc-changelog.ts --lookback-days=14 2>/dev/null
```

Use `--lookback-days` when the user asks for changes from a specific time period (e.g. "last 14 days", "last week" = 7 days).

2. Parse the JSON output and present a **concise, themed** summary:

### Format rules

- **Rank all items, then keep top 50%.** Score each candidate bullet by combined weight (high → low):
  1. Personal relevance — matches user's installed skills, commands, plugins, hooks, usage patterns
  2. User-facing surface changes — visible message/UI text, prompts, output format, defaults the user reads or types
  3. Parameter / flag / config / API / schema changes — anything the user invokes or configures (CLI flags, settings keys, hook events, tool schemas, command args)
  4. New features / capabilities — net-new things user can do
  5. Behavioral changes — different output for same input, removed/changed defaults, breaking changes
  6. Internal / perf / refactor — deprioritize unless user-observable. A perf win that doesn't change behavior or UX ranks low.
     Sort all candidates by this combined score, drop bottom half. Round up on odd counts. Mention dropped count at bottom.
- **Group surviving items by theme, not by version.** Cluster into categories (e.g. "Startup & Performance", "Plugins & Skills", "Agent Teams", "Bash & Permissions").
- **Each item = 1 short line.** Rewrite verbose changelog entries into punchy summaries (5-15 words). Append version+date tag: `(2.1.47, Feb 18)`
- **Lead with a 1-2 sentence TL;DR** of the most impactful changes for this user.
- **Explain WHY it's relevant** by referencing what the user uses. Don't just say "matches: Bash" - say things like "you use hooks" or "affects your StatusLine setup".

```
## Claude Code changelog - {version range} ({date range})

{1-2 sentence TL;DR of biggest changes relevant to user}

### {Theme name}
- {Punchy summary} (2.1.47, Feb 18) — {why it matters to you}
- ...

### {Theme name}
- ...

### System prompt
{Summarize the diff concisely - see rules below}

{N} lower-ranked items skipped. [Full changelog]({url})
```

3. If the `versions` array is empty, say: "You're up to date! No new changes since {currentVersion}." Do NOT advance the watermark.

4. **After presenting results to the user**, advance the watermark so the same changes aren't shown again:

```bash
${CLAUDE_SKILL_DIR}/scripts/cc-changelog-advance.ts 2>/dev/null
```

Only run this AFTER the changelog summary is fully rendered. Never run it if the versions array was empty.

### System prompt diff rules

When `systemPromptDiff.prompt` or `systemPromptDiff.flags` is non-null, summarize the unified diff into actionable bullet points. Categorize changes:

**Prompt changes** - summarize each meaningful hunk as one bullet:

- New sections/blocks added (e.g. "New `currentDate` context block added")
- Instructions changed (e.g. "Auto memory guidelines expanded with what to/not to save")
- Tool schema changes (e.g. "AskUserQuestion got `markdown` preview field")
- Model/version bumps (e.g. "Knowledge cutoff Jan 2025 -> Aug 2025")
- Removed content (e.g. "Agent Teams 'not available' disclaimer removed")

**Flag changes** - list added/removed flags:

- Added: `flag_name`
- Removed: `flag_name`

Skip cosmetic changes (typo fixes, whitespace, path changes in test environments). Focus on behavioral changes that affect how Claude works.

## Notes

- The script handles all data fetching, parsing, and relevance scoring
- State is persisted at `~/.claude/custom-cache/cc-changelog-state.json`
- First run uses a 14-day lookback window; subsequent runs check from last version
- Requires `gh` CLI authenticated with GitHub
