---
allowed-tools: Task
description: List all built-in Claude Code slash commands
---

## Context

Show all built-in slash commands available in Claude Code's interactive mode.

## Output format

Present results in a clean, scannable format matching this structure:

```
Built-in Commands
{N} commands

Navigation
/clear · Clear conversation history
/compact · Compact conversation context

...more categories with commands...
```

Rules:
- Group commands by category
- Each command: `/{name} · {short description}`
- Show total count at top
- No token counts or other metadata
- Use a horizontal rule between the header and the categories

## Your task

Use the Task tool with the claude-code-guide subagent to retrieve the list of built-in commands:

subagent_type: claude-code-guide
prompt: "What are all the built-in interactive mode commands (slash commands) available in Claude Code? List every command grouped by category, with a short description for each."
model: haiku
