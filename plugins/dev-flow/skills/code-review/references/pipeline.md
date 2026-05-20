# Code Review Pipeline

Analyzes diffs by data source. Each agent has unique investigation scope, no overlap.

**Inputs from caller:**

- `DIFF_FILE` — path to diff
- `CHANGED_FILES` — list of changed file paths
- `TITLE` — branch / diff title
- `RULES_FILE` (optional) — path to a project rules markdown file. When set, Agent 1 reads it in addition to repo-discovered rules. Caller resolves precedence (user-passed `--rules` over wrapper-pinned default) before invoking.

---

## Phase 1: Context Gathering (Sequential, Haiku)

### Step 1.0: Verify Rule Files Exist

```bash
fd CLAUDE.md --type f
fd . .claude/rules --type f 2>/dev/null
```

If `RULES_FILE` is set, that counts as a rule file (verify it exists; abort if path is invalid). Otherwise, if neither CLAUDE.md nor .claude/rules/ exist, abort: "No rule files found. Create CLAUDE.md, .claude/rules/, or pass `--rules <path>` to enable code review."

### Step 1.1: Collect Rule Paths

```
Find ALL rule files in this repo. Return JSON array of absolute paths.

Search for:
- Root CLAUDE.md
- CLAUDE.md in any subdirectory
- All files in .claude/rules/
- Any linter/formatter config files in the repo root

If RULES_FILE was provided by the caller, include it in the array (absolute path).

Do not read file contents. Only return paths.

Output: ["path/to/CLAUDE.md", ".claude/rules/sfc-structure.md", ...]
```

### Step 1.2: Detect Project Context

```
Detect project type from config files and file extensions. Return JSON.

Look at:
- Config files in repo root to identify language/framework
- File extensions of changed files
- Any project-specific conventions

Output: { "projectType": "...", "fileTypes": [".ext1", ...], "configNotes": "..." }
```

### Step 1.3: Summarize Changes

```
Read the diff. Return JSON summary.

Include:
- Brief summary (2-3 sentences max)
- Changed files grouped: { new: [], modified: [], deleted: [], renamed: [] }
- Imports added/removed

Do not analyze for issues yet.

Output: { "summary": "...", "changedFiles": {...}, "importChanges": [...] }
```

---

## Phase 2: Parallel Review Agents (Sonnet)

Launch all 6 agents in parallel.

**Common input:**

- Diff file path
- Rule file paths (Step 1.1)
- Project context (Step 1.2)
- Changed files list (Step 1.3)

**False positive list (verbatim to ALL agents):**

```
SKIP THESE - false positives:

- Pre-existing issues not introduced by this diff
- Issues a linter/typechecker/compiler would catch
- Style preferences NOT explicitly in rule files
- Changes on lines not modified in the diff
- Intentional changes aligned with the PR purpose
- Test files with intentionally "bad" code
- Issues silenced by inline ignore/disable comments
- General quality issues (test coverage, docs) unless explicitly required in rules
- Obvious functionality changes that are intentional
```

---

### Agent 1: Rules Compliance

Data: rule files + diff.

```
Read EVERY rule file from provided paths.

For each rule:
1. Extract each requirement
2. Check if diff violates it
3. Quote rule text VERBATIM

- Do NOT interpret or paraphrase
- If rule ambiguous, skip

Output per issue:
{
  "file": "...",
  "line": 42,
  "issue": "...",
  "ruleFile": "...",
  "ruleText": "exact quote",
  "severity": "important"
}
```

### Agent 2: Shallow Bug Scan

Data: diff only.

```
Check ONLY changed/added lines for obvious bugs.

Look for:
- Inverted conditions, wrong operators
- Code contradicting itself within the diff
- Patterns project rules explicitly flag

Derive "bug" from CLAUDE.md, .claude/rules/, linter configs.

Do NOT:
- Assume language/framework
- Follow imports
- Look at unchanged code
- Flag stylistic issues

Output per issue:
{
  "file": "...",
  "line": 81,
  "issue": "...",
  "why": "...",
  "severity": "important"
}
```

### Agent 3: Dependency & Type Verification

Data: diff + imported files + type defs.

```
For each new/changed import:
1. Read imported file
2. Find function/type used
3. Verify usage matches API

For each external call:
1. Find definition (LSP or grep)
2. Check parameter types
3. Check return type handled

Output per issue:
{
  "file": "...",
  "line": 123,
  "issue": "...",
  "dependency": "...",
  "expectedUsage": "...",
  "actualUsage": "...",
  "severity": "important"
}
```

### Agent 4: Historical Context

Data: git blame + git log for modified files.

```
For each modified file:
1. git blame <file>
2. Sections w/ recent changes: git log -p -5 -- <file>

Look for:
- Reverted changes being reintroduced
- Patterns previously fixed (then broken again)
- Comments explaining WHY
- Recent commits establishing patterns now violated

Output per issue:
{
  "file": "...",
  "line": 50,
  "issue": "Reintroducing pattern removed in abc123",
  "historicalContext": "Commit abc123 removed this because...",
  "commitRef": "abc123",
  "severity": "important"
}
```

### Agent 5: Architectural Soundness

Data: diff + surrounding code (read changed files in full when needed).

```
Look at the SHAPE of the change, not the mechanics. For each meaningfully
changed surface (function signature, component props, module boundary,
shared utility), ask the core question:

  If I were designing this from scratch TODAY, knowing what this PR adds,
  would I put it here, in this shape, with this surface?

Checklist of smells to flag:
- Interface widening to satisfy a single caller (new optional param /
  prop / overload used by exactly one site)
- Mode-flag parameters (boolean / enum that toggles behavior — usually
  means two functions trying to be one)
- Argument-count creep past ~3-4 on shared APIs
- Prop sprawl on shared components
- Premature generalization (abstraction with one concrete user, or
  parameters no caller passes)
- Premature de-generalization (inlining a working abstraction because
  one caller wanted a tweak)
- Cross-module coupling (feature module reaching into another feature
  module instead of going through shared/common)
- Lift-and-forget state (state hoisted to a parent without obvious
  reason — usually wrapper components that add nothing)
- Wrapper components / composables that add no behavior over what they
  wrap
- Config-option fix where a default change would have served (new flag
  added so the one caller can opt in, instead of fixing the default)
- File placement (new code dropped in `_common` / `_shared` /
  `resources/` when it's actually module-specific, or vice versa)

Do NOT:
- Flag stylistic preferences
- Flag patterns the existing codebase clearly already uses without complaint
- Suggest refactors unrelated to what this PR touches

Severity rule (fold into existing buckets — no new bucket):
- Strong smell with clear payoff to fix → "important" (becomes Concern)
- Mild smell or judgment-call → "nit" (becomes Nit)

Output per issue:
{
  "file": "...",
  "line": 42,
  "issue": "<which smell, one sentence>",
  "why": "<why it's wrong here, citing the surface that changed>",
  "betterShape": "<one-line sketch of what the design would look like instead>",
  "severity": "important" | "nit"
}
```

### Agent 6: Code Comments Compliance

Data: full file content.

```
For each modified file, read FULL content.

Find all comments. Pay attention to:
- TODO, FIXME, HACK, NOTE, WARNING markers
- Comments explaining WHY

Check if changes:
1. Violate guidance in nearby comments
2. Remove TODOs without resolving
3. Ignore warnings
4. Break invariants described in comments

Output per issue:
{
  "file": "...",
  "line": 42,
  "issue": "...",
  "commentText": "// WARNING: ...",
  "severity": "important"
}
```

---

## Phase 3: Issue Scoring (Parallel Haiku)

For EACH issue from Phase 2 — separate Haiku agent. Limit: max 20 issues (sort by apparent severity if more).

```
You are verifying a potential code review issue.

Issue: {issue.issue}
File: {issue.file}
Line: {issue.line}
Found by: {agent}
Reason: {issue.why or issue.ruleText or issue.betterShape}

Rule files: {paths from Step 1.1}
Relevant diff section: {context}

Score 0-100:

0:   False positive. Pre-existing. Not actually a bug.
25:  Might be real but unverified. Stylistic, not in rules.
50:  Real but minor. Nitpick. Mild design smell. Low impact.
75:  Verified real. Will impact functionality. OR explicitly in rule files. OR strong design smell.
100: Definitely real. Confirmed w/ evidence. Frequent. High impact.

VERIFICATION:
- Rule-based: re-read rule, confirm wording.
- Bug: trace code path, confirm it can occur.
- Dependency: check surrounding code handles case.
- Architectural: confirm the smell describes a real coupling / surface
  problem, not just an unfamiliar pattern.

Output: { "score": 75, "reasoning": "..." }
```

---

## Phase 4: Filter & Format

### Filter

- Keep score ≥ 50
- Zero remaining → output "No issues found"

### Group

- Critical: ≥ 90 (must-fix; breaks correctness, security, or an explicit rule)
- Concerns: 75-89 (real issues, including strong architectural smells)
- Nits: 50-74 (low impact, mild smells, judgment calls)

### Format

```markdown
## Code Review: {TITLE}

**Files changed:** X | **Issues:** X critical, X concerns, X nits

### Critical (score ≥90)

- **[file:line]** Issue
  - **Evidence:** {rule text / commit ref / comment / design smell}
  - **Fix:** ...

### Concerns (score 75-89)

- **[file:line]** Issue
  - **Evidence:** ...
  - **Fix:** ...

### Nits (score 50-74)

- **[file:line]** Issue — one-line fix

### Summary

- **Recommendation:** approve | request-changes | needs-discussion
- **Risk areas:** ...
```

---

## Error Handling

- **Failed agents:** skip, continue, log warning. Partial review > none.
- **Large diffs (>50 files):** caller already warned in detection step.
- **Missing rules:** abort (Step 1.0).
- **Unparseable files:** auto-skip binary/minified/generated.

## Notes

- Agents defined by data source — no overlap.
- Rules passed as paths; agents read directly. No paraphrasing.
