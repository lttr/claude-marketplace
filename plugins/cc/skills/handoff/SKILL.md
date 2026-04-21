---
name: cc:handoff
description: Write ~/.claude/custom-handoff.md to hand off current work to the next session
disable-model-invocation: true
allowed-tools: Write, Bash(trash-put:*), Bash(git status:*), Bash(git log:*), Bash(git diff:*)
---

Write `~/.claude/custom-handoff.md` (resolve `~` to the user's home directory) summarizing current work so the next Claude session can pick up where this one left off.

## Steps

1. Run `trash-put ~/.claude/custom-handoff.md 2>/dev/null || true` to remove any prior handoff (ignore error if file absent).
2. Write fresh content per template. No merge, no preserve.

## Template

```markdown
# ORIGINAL PROMPT

<the user's opening prompt from this conversation, verbatim if short; otherwise a one-to-two-sentence summary that preserves the ask>

# GOAL

<one line: what we're doing now>

# DONE

- <thing done>
- <thing done>

# NEXT

<one thing to do next>

# WATCH OUT

<gotchas; omit section if none>
```

## Rules

- Terse, scannable, under 200 words total.
- `# ORIGINAL PROMPT` anchors intent across sessions — do not drop it even if the work has drifted.
- Use file paths, not descriptions (e.g. `src/auth.ts:42`, not "the auth file").
- No prose narration ("we decided to...").
- Omit `# WATCH OUT` when there are no gotchas.
