---
description: List all available Claude Code custom commands
---

List all available custom commands from your current context.

## How to find commands

Use `fd` with `-L` flag to follow symlinks:

```bash
fd -L -t f '.md$' ~/.claude/commands/ 2>/dev/null
fd -L -t f '.md$' .claude/commands/ 2>/dev/null
```

Also check plugin commands (already found via skills list).
