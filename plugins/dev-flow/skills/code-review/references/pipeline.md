# Code Review Pipeline

Analyzes diffs by data source. Each lens has unique investigation scope, no overlap.

**Inputs from caller:**

- `DIFF_FILE` — path to diff
- `CHANGED_FILES` — list of changed file paths
- `TITLE` — branch / diff title
- `RULES_FILE` (optional) — path to a project rules markdown file. When set, Lens 1 reads it in addition to repo-discovered rules. Caller resolves precedence (user-passed `--rules` over wrapper-pinned default) before invoking.

---

## Execution Contract (read first)

**Mandatory:** every phase below runs. The lens set that applies (see Step 1.4 kind routing) produces structured issue objects. Every produced issue is scored in Phase 3. Output is the Critical/Concerns/Nits format from Phase 4. No freeform reviews.

**Inline vs. fan-out is a perf choice:**

- **Inline allowed** when ALL hold: ≤100 total diff lines AND no single file has >50 changed lines.
- **Otherwise:** fan out the applicable lenses (Phase 2) and per-issue scoring (Phase 3) via the Task tool, parallel.

**Lens routing by diff kind (Step 1.4):**

- `data` (i18n / fixtures / snapshots — see Step 1.4 for exact paths) → lenses 1 (Rules) + 2 (Bug-scan) only.
- `docs` (`*.md`, `*.mdx`, `*.rst`, `*.txt`) → lenses 1 (Rules) + 6 (Inline Guidance) only.
- `code` (anything else, or mixed) → all 6 lenses.

When in doubt between `data`/`docs` and `code`, pick `code`. Mixed diffs are always `code`.

**Forbidden:** skipping the applicable lenses because the diff "looks small" or you "have enough context." "I'll produce the review directly" is not a valid shortcut — within a kind, the chosen lenses exist because each catches a class the others miss.

---

## Phase 1: Context Gathering (Sequential, Haiku)

### Step 1.0: Verify Rule Files Exist

```bash
# fd preferred; fall back to find if unavailable
fd CLAUDE.md --type f 2>/dev/null || find . -name CLAUDE.md -type f -not -path '*/node_modules/*'
fd . .claude/rules --type f 2>/dev/null || find .claude/rules -type f 2>/dev/null
```

If `RULES_FILE` is set, that counts as a rule file (verify it exists; abort if path is invalid). Otherwise, if neither CLAUDE.md nor .claude/rules/ exist, abort: "No rule files found. Create CLAUDE.md, .claude/rules/, or pass `--rules <path>` to enable code review."

### Step 1.1: Collect Rule Paths

```
Find ALL rule files in this repo. Return JSON array of absolute paths.

Search for:
- Root CLAUDE.md
- CLAUDE.md in any subdirectory
- All files in .claude/rules/

(Linter/formatter configs are NOT rule files for Lens 1 — Lens 1 must quote rule prose verbatim, and rule numbers/JSON keys don't fit. Lens 2 reads linter configs on its own to derive "bug" patterns.)

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

### Step 1.4: Classify Diff Kind

Determine `DIFF_KIND` from the changed files. Drives Phase 2 lens selection (see Execution Contract).

Classification is **path-based only** (works from `CHANGED_FILES` + the Step 1.3 summary — no diff-hunk parsing).

Rules:

- **`data`** — every changed file matches one of these path patterns:
  - i18n / locale files: `locales/**`, `i18n/**`, `translations/**`, `*.po`, `*.ftl`
  - fixtures / mocks: `fixtures/**`, `__fixtures__/**`, `mocks/**`, `__mocks__/**`
  - snapshots: `__snapshots__/**`, `*.snap`

  Generic `*.json` / `*.yaml` / `*.toml` files do NOT qualify — a `tsconfig.json` or `package.json` edit is build-config and routes to `code` so Lens 3/4/5 apply.

- **`docs`** — every changed file is `*.md`, `*.mdx`, `*.rst`, or `*.txt`.
- **`code`** — anything else, OR any mix of categories.

A single non-data/non-docs file → `code`. When in doubt → `code`.

Output: `{ "kind": "data" | "docs" | "code", "reason": "<one line>" }`

---

## Phase 2: Review Lenses (Sonnet)

Run the lens set for `DIFF_KIND` (see Execution Contract):

- `data` → Lens 1 + Lens 2.
- `docs` → Lens 1 + Lens 6.
- `code` → all 6 lenses.

Each lens produces structured issue objects (schemas per lens). Above the inline threshold, launch the selected lenses as parallel Task-tool subagents; at or below, you may inline — but **every lens in the selected set must run**.

**Common input:**

- Diff file path
- Rule file paths (Step 1.1)
- Project context (Step 1.2)
- Changed files list (Step 1.3)
- `DIFF_KIND` (Step 1.4)

**False positive list (verbatim to ALL lenses):**

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

### Lens 1: Rules Compliance

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

### Lens 2: Shallow Bug Scan

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

### Lens 3: Dependency & Type Verification

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

### Lens 4: Historical Context

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

### Lens 5: Architectural Soundness

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

### Lens 6: Inline Guidance Compliance

Data: full file content.

Scans authorial guidance left in files — code comments in code files, admonitions / callouts / HTML comments (`<!-- NOTE: ... -->`) in docs files.

```
For each modified file, read FULL content.

Find inline guidance. Depending on file type:
- Code files (.ts/.js/.py/.vue/etc): code comments — TODO, FIXME, HACK,
  NOTE, WARNING markers; comments explaining WHY.
- Docs files (.md/.mdx/.rst): HTML comments, callout blocks
  (`> [!NOTE]`, `> [!WARNING]`, `:::note`, `:::warning`), and inline
  TODO/FIXME markers.

Check if changes:
1. Violate guidance in nearby comments / admonitions
2. Remove TODOs without resolving
3. Ignore warnings
4. Break invariants described in guidance

Output per issue:
{
  "file": "...",
  "line": 42,
  "issue": "...",
  "commentText": "// WARNING: ..." or "<!-- NOTE: ... -->",
  "severity": "important"
}
```

---

## Phase 3: Issue Scoring (Haiku)

Score EVERY issue from Phase 2. Cap at 20.

**Cap sort order (when >20 issues):**

1. `severity = "important"` before `severity = "nit"`.
2. Tie-break by lens order: 1 (Rules) → 2 (Bug-scan) → 3 (Deps/Types) → 4 (History) → 5 (Architecture) → 6 (Inline Guidance).
3. Final tie-break: file path, then line number.

Above the inline threshold, fan out as parallel Haiku subagents; at or below, inline scoring is fine — but scoring is not optional and the rubric below is mandatory.

```
You are verifying a potential code review issue.

Issue: {issue.issue}
File: {issue.file}
Line: {issue.line}
Found by: {lens}
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

- **Failed lenses:** skip, continue, log warning. Partial review > none.
- **Large diffs (>50 files):** caller already warned in detection step.
- **Missing rules:** abort (Step 1.0).
- **Unparseable files:** auto-skip binary/minified/generated.

## Notes

- Lenses defined by data source — no overlap.
- Rules passed as paths; lenses read directly. No paraphrasing.
