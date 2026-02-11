# aiwork-folder-protocol

`.aiwork/` is a repository-local folder for AI-related work artifacts, organized by feature or task.

## What it provides

A consistent convention for organizing AI work artifacts per task:

- **triage** - Requirement analysis
- **research** - Knowledge gathering
- **spec** - Implementation specification
- **plan** - Implementation steps (multiple allowed)
- **review** - Code review reports
- **notes** - Freeform process notes
- **docs/** - Downloaded reference documentation

Each task gets its own dated folder (e.g., `2026-01-27_auth-refactor/`) with artifacts created sequentially inside.

## Installation

1. Copy `aiwork-protocol.md` to `~/.claude/`:

```bash
cp aiwork-protocol.md ~/.claude/aiwork-protocol.md
```

2. Add reference to your `~/.claude/CLAUDE.md`:

```markdown
## AI-Generated Artifacts

@aiwork-protocol.md
```

The protocol will now load in every Claude Code session.

## Usage with dev-flow

This protocol pairs well with the [dev-flow](../dev-flow) plugin which provides commands that generate artifacts following this convention:

- `/df:triage` - Creates triage documents
- `/df:review` - Creates code review reports

## Manual usage

Even without dev-flow, Claude will follow the protocol when asked to save plans, specs, or other artifacts to the repository's `.aiwork/` folder.
