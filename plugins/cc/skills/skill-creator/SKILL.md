---
name: skill-creator
description: Guide for creating and editing Claude Code skills. Use when user wants to create a new skill, update an existing skill, or needs help structuring a SKILL.md file.
---

# Skill Creator

## Process

### 1. Gather requirements

Ask the user:

- What task/domain does the skill cover?
- What specific use cases should it handle?
- Does it need executable scripts or just instructions?
- Any reference materials to include?

If the user's description is already clear, skip straight to drafting.

### 2. Determine placement

Infer from context, ask only if ambiguous:

- **Global** (`~/.claude/skills/`) - across all projects
- **Project** (`<project>/.claude/skills/`) - repo-specific
- **Plugin** (`<plugin>/plugins/<name>/skills/`) - distributed via marketplace

### 3. Assess complexity

**Simple** (just write the SKILL.md):

- Purely instructional (workflow, guidelines, domain knowledge)
- No supporting files needed

**Full** (skill with bundled resources):

- Needs scripts for deterministic/repeated operations
- Needs reference docs (schemas, API docs, large knowledge bases)
- Needs assets (templates, images, fonts)

### 4. Draft the skill

**Simple path:** Create the directory and write SKILL.md directly.

**Full path:**

1. Plan supporting files (what scripts/references/assets are needed)
2. Create the skill directory and subdirs
3. Write supporting files first (may need user input for assets/docs)
4. Write SKILL.md last, referencing the supporting files

### 5. Review with user

Present draft and iterate. Skills improve most after real usage.

## Skill Structure

```
skill-name/
├── SKILL.md              # Main instructions (required)
├── references/           # Docs loaded into context on demand (optional)
│   ├── api-reference.md
│   └── schema.md
├── scripts/              # Deterministic code (optional)
│   └── helper.py
└── assets/               # Files used in output (optional)
    └── template.html
```

Reference supporting files from SKILL.md so Claude knows they exist:

```md
- For API details, see [references/api-reference.md](references/api-reference.md)
- For schema docs, see [references/schema.md](references/schema.md)
```

## SKILL.md Format

```md
---
name: skill-name
description: Brief description of capability. Use when [specific triggers].
---

# Skill Name

[Core instructions, workflows, and guidance]
```

### Key frontmatter fields

| Field                      | Description                                                                                                              |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `name`                     | Skill identifier, becomes `/slash-command`. Lowercase, hyphens, max 64 chars.                                            |
| `description`              | What it does + when to trigger. Claude uses this to decide when to load the skill.                                       |
| `disable-model-invocation` | `true` to prevent Claude auto-loading (manual `/invoke` only). Use for side-effect workflows like deploy, commit.        |
| `user-invocable`           | `false` to hide from `/` menu. Use for background knowledge Claude should load automatically but users shouldn't invoke. |
| `allowed-tools`            | Tools Claude can use without permission prompts when skill is active. E.g. `Read, Grep, Glob`.                           |
| `context`                  | `fork` to run in an isolated subagent. Skill content becomes the subagent's task.                                        |
| `agent`                    | Subagent type when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, or custom agent name.                 |
| `argument-hint`            | Autocomplete hint, e.g. `[issue-number]` or `[filename]`.                                                                |

### String substitutions

Use in skill content for dynamic values:

- `$ARGUMENTS` - all arguments passed when invoking (`/skill-name arg1 arg2`)
- `$0`, `$1`, `$2` - individual arguments by position
- `${CLAUDE_SESSION_ID}` - current session ID
- `` !`command` `` - preprocesses shell command output into the prompt before Claude sees it

## Writing Guidelines

**Description** is the most important field. It's the only thing Claude sees when deciding which skill to load. Include:

- First sentence: what the skill does
- Second sentence: when to trigger it (keywords, file types, scenarios)
- Max 1024 chars, third person

**Two types of skill content:**

- **Reference** - knowledge Claude applies to current work (conventions, patterns, domain knowledge). Runs inline alongside conversation.
- **Task** - step-by-step instructions for a specific action (deploy, commit, code generation). Often paired with `disable-model-invocation: true`.

**Body** should contain:

- Procedural knowledge non-obvious to Claude
- Concrete workflows with actionable steps
- References to supporting files so Claude knows they exist

**Keep SKILL.md lean.** Aim for under 200 lines, hard max 500. Move detailed material to supporting files.

## When to Add Scripts

Add `scripts/` when:

- Same code would be generated repeatedly
- Operation needs deterministic reliability
- Errors need explicit handling

Scripts save tokens and improve reliability vs regenerating code each time.

**Path resolution:** For plugin skills, reference scripts with `${CLAUDE_SKILL_DIR}/scripts/helper.js` (relative paths won't resolve). Use `${CLAUDE_PLUGIN_ROOT}` only when referencing files outside the skill's own directory. For global/project skills, relative paths work fine.

## When to Split Files

Split content out of SKILL.md when:

- SKILL.md would exceed ~200 lines
- Content covers distinct domains (separate files per domain)
- Advanced features are rarely needed
- Large schemas, API docs, or knowledge bases

Prefer multiple focused files over one large reference file. E.g. `api-reference.md`, `schema.md`, `examples.md` rather than a single `reference.md` with everything.

For large files (>10k words), include grep patterns in SKILL.md so Claude can search efficiently.

## Review Checklist

After drafting, verify:

- [ ] Description includes triggers ("Use when...")
- [ ] SKILL.md is lean (under ~200 lines)
- [ ] No time-sensitive information
- [ ] Concrete examples included where helpful
- [ ] All supporting files referenced in SKILL.md
- [ ] No duplicate info between SKILL.md and supporting files
