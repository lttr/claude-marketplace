---
name: df:code-review
description: Core code review logic. Trigger when invoked by review commands. Do not trigger directly from user requests - use /df:review or /df:azdo:review instead.
---

# Code Review Skill

Analyzes code diffs for issues, checking against project conventions, security concerns, and common bugs.

**Expected input from invoking command:**
- Diff content
- List of changed files
- Optional: PR metadata (title, description, author)

## Phase 1: Context Gathering

Before reviewing, gather project context:

### 1.1 Project Guidelines

```bash
# Find all CLAUDE.md files
fd CLAUDE.md --type f
```

Read root `CLAUDE.md` plus any in directories containing changed files.

### 1.2 Tech Stack Detection

Check for these files to understand the stack:

| File | Stack |
|------|-------|
| `package.json` | Node.js - check dependencies, scripts |
| `tsconfig.json` | TypeScript - check strict settings |
| `pyproject.toml` / `requirements.txt` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `composer.json` | PHP |

### 1.3 Linter/Formatter Configs

Check for project conventions:
- `.eslintrc*`, `eslint.config.*` - JS/TS linting rules
- `biome.json` - Biome config
- `.prettierrc*` - Formatting
- `ruff.toml`, `.ruff.toml` - Python linting
- `.editorconfig` - Editor settings

### 1.4 Git History Context

```bash
# Get blame for changed files to understand patterns
git blame --line-porcelain <file> | head -100
```

Focus on recently modified sections to understand coding patterns.

## Phase 2: Parallel Review Agents

Launch these review agents in parallel (use Sonnet model):

### Agent 1: CLAUDE.md Compliance

Check if changes follow project guidelines:
- Naming conventions
- File organization patterns
- Architectural boundaries
- Technology choices
- Testing requirements

### Agent 2: Bug Scan

Shallow scan for obvious issues in **changed lines only**:
- Null/undefined access without checks
- Off-by-one errors
- Resource leaks (unclosed handles, missing cleanup)
- Race conditions in async code
- Incorrect error handling
- Logic errors (wrong operator, inverted condition)

### Agent 3: Convention Check

Based on detected tech stack:
- Naming consistency (camelCase, snake_case, etc.)
- Import organization
- File/folder structure patterns
- API design patterns
- Error handling patterns

### Agent 4: Security Scan

OWASP basics on changed code:
- SQL injection (string concatenation in queries)
- XSS (unescaped user input in HTML)
- Command injection (shell commands with user input)
- Path traversal (file paths from user input)
- Hardcoded secrets/credentials
- Insecure dependencies (if package files changed)

## Phase 3: Issue Scoring

For each issue found, launch a Haiku agent to score:

| Score | Meaning |
|-------|---------|
| 0-25 | False positive or pre-existing issue |
| 50 | Minor nitpick, style preference |
| 75 | Real issue, should be addressed |
| 100 | Critical, will cause bugs/security issues |

**Scoring criteria:**
- Is this introduced by the current changes? (not pre-existing)
- Would this be caught by linter/compiler? (skip if yes)
- Is this a style preference or a real problem?
- What's the blast radius if this goes to production?

## Phase 4: Filter and Report

Only include issues scored **≥75**.

### Output Format

```markdown
## Code Review: <title or branch name>

**Files changed:** X | **Issues found:** X critical, X important

### Critical Issues (score ≥90)

- **[file:line]** Description
  - Why: <explanation>
  - Suggestion: <fix>

### Important Issues (score 75-89)

- **[file:line]** Description
  - Why: <explanation>
  - Suggestion: <fix>

### Summary

- **Recommendation:** <approve | request-changes | needs-discussion>
- **Risk areas:** <list high-risk changes if any>
```

## False Positives to Ignore

Always skip:
- Pre-existing issues not introduced by this diff
- Issues a linter/compiler would catch
- Pure style preferences not in CLAUDE.md
- Changes on lines not modified in the diff
- Intentional changes aligned with PR/branch purpose
- Test files with intentionally "bad" code for testing

## Notes

- This skill is invoked by commands, not directly by users
- Commands provide the diff; skill provides the analysis
- All file reads and searches use the invoking command's allowed-tools
