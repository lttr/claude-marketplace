# aiwork-folder-protocol

`.aiwork/` is a folder for AI-related work. This protocol standardizes how artifacts are organized across projects.

## What it provides

A consistent convention for storing and naming:

- **plans/** - Implementation plans
- **specs/** - Task specifications
- **triage/** - Requirement analysis
- **reviews/** - Code review reports
- **logs/** - Action logs

## Installation

1. Copy `AIWORK.md` to `~/.claude/`:

```bash
cp AIWORK.md ~/.claude/AIWORK.md
```

2. Add reference to your `~/.claude/CLAUDE.md`:

```markdown
## AI-Generated Artifacts

@AIWORK.md
```

The protocol will now load in every Claude Code session.

## Usage with dev-flow

This protocol pairs well with the [dev-flow](../dev-flow) plugin which provides commands that generate artifacts following this convention:

- `/df:triage` - Creates triage documents
- `/df:review` - Creates code review reports

## Manual usage

Even without dev-flow, Claude will follow the protocol when asked to save plans, specs, or other artifacts to `.aiwork/`.
