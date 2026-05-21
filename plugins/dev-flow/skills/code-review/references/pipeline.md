# Code Review Pipeline

Analyzes diffs by data source. Each lens has unique investigation scope, no overlap.

**Inputs from caller:**

- `DIFF_FILE` — path to diff
- `CHANGED_FILES` — list of changed file paths
- `TITLE` — display title (caller-resolved)
- `BRANCH`, `PR`, `TICKET` (optional) — header labels, omitted from output when empty. Do not influence lens selection or scoring.
- `RULES_FILE` (optional) — project rules markdown. When set, Lens 1 reads it alongside repo-discovered rules.

---

## Execution Contract (read first)

**Mandatory:** every phase below runs. The lens set that applies (see Step 1.4 kind routing) produces structured issue objects. Every produced issue is scored in Phase 3, where its cited line is resolved against the actual file. Output is the Critical/Concerns/Nits format from Phase 4. No freeform reviews.

**Line numbers (applies to every lens and to output):** `line` ALWAYS means the line number in the **post-change file** — the `+` side of the hunk, derived from the `@@ -a,b +c,d @@` header plus the offset within the hunk. It is NOT the position within the diff/patch (cumulative hunk-line count). A finding on a deleted (`-`) line cites the nearest surviving line and says so. Phase 3 re-resolves every cited line against the real file and drops findings whose line can't be located.

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

## Phase 1: Context Gathering (Sequential, Sonnet)

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

**Path-based pre-filter — only kicks in above ~5 rule files.** With one pinned `RULES_FILE` or a single root `CLAUDE.md`, skip this and read everything. When there are more than ~5 rule files, don't make Lens 1 read all of them — keep only the ones that could apply to the changed paths. Keep a file if any of these is true:

- it's a root / global rule file (always keep)
- a changed file lives under its directory
- its name matches a changed area (keep `i18n.md` when the diff touches `translations/`)

When unsure, keep it — this trims obviously-irrelevant files, it doesn't gamble on recall. Note in `coverage` which files were kept vs skipped.

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

## Phase 2: Review Lenses

Run the lens set for `DIFF_KIND` (see Execution Contract):

- `data` → Lens 1 + Lens 2.
- `docs` → Lens 1 + Lens 6.
- `code` → all 6 lenses.

**Model per lens** (reasoning-heavy lenses get Opus; mechanical ones Sonnet):

- Lens 1 (Rules) → **Opus** — must walk every rule exhaustively.
- Lens 2 (Bug-scan) → **Opus** on `code` diffs (it traces logic), **Sonnet** on `data` diffs.
- Lens 5 (Architecture) → **Opus** — design-smell judgment.
- Lenses 3, 4, 6 → **Sonnet**.

Each lens produces structured issue objects (schemas per lens). Above the inline threshold, launch the selected lenses as parallel Task-tool subagents (with the model above); at or below, you may inline — but **every lens in the selected set must run**.

**Every issue object must include** `"lens": "Rules" | "Bug-scan" | "Deps & Types" | "History" | "Architecture" | "Inline Guidance"` — Phase 4 tags each finding with it. Implicit on every per-lens schema below.

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

Data: rule files + diff. **Model: Opus.** This is an exhaustive, line-item walk — not a sampling pass.

```
Read EVERY rule file from provided paths, in full.

Enumerate EVERY rule / numbered requirement across all files. Walk them
one by one — do not sample, do not stop early, do not skip a rule because
the diff "probably" complies. For each rule, decide one of: violated /
complied / not-applicable.

For each rule:
1. Extract each requirement
2. Check if diff violates it (only NEW or CHANGED (+) lines)
3. Quote rule text VERBATIM

- Do NOT interpret or paraphrase
- If a rule is genuinely ambiguous, mark it not-applicable (do not invent a violation)

Output:
{
  "rulesWalked": <total rules enumerated>,
  "coverage": "<one line: e.g. 'walked 8 rule files, 47 numbered rules'>",
  "issues": [
    {
      "file": "...",
      "line": 42,
      "issue": "...",
      "ruleFile": "...",
      "ruleText": "exact quote",
      "severity": "important"
    }
  ]
}
```

The `rulesWalked` / `coverage` fields are mandatory — they force completeness and surface a skipped walk. They are diagnostic only (not scored issues); the consolidator may note coverage in the Summary but it does not appear as a finding.

### Lens 2: Bug Scan

Data: diff (+ the surrounding lines needed to trace a changed conditional). **Model: Opus on `code` diffs, Sonnet on `data`.**

A bare "find bugs" prompt is unreliable — bug findings don't converge across runs. The forcing function below is what makes this lens worth running: **emit a defect only if you can name a concrete input that triggers it.** No demonstrable input → not a finding.

```
Examine the changed/added (+) lines for logic defects.

For each changed conditional, filter predicate, comparison, or temporal
expression:
- State its intent in plain words.
- Walk the boundary and inverted cases — does the operator/branch do
  what the intent says? (off-by-one, flipped comparison, `&&`/`||`
  swap, inclusive vs exclusive range, missing null/empty case.)
- Temporal logic: is the comparison direction right (before/after), and
  are both sides the same type/zone?

Also flag: code contradicting itself within the diff, and patterns the
project rules explicitly call bugs (derive from CLAUDE.md / .claude/rules/
/ linter configs).

HARD GATE: emit a defect ONLY if you can state a concrete input that
makes it misbehave. If you can't produce that input, drop it.

Do NOT:
- Flag stylistic issues (that's other lenses)
- Flag anything a linter/typechecker already catches
- Speculate about behavior you can't demonstrate

Output per issue:
{
  "file": "...",
  "line": 81,
  "issue": "...",
  "why": "...",
  "trigger": "<the concrete input that breaks it>",
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

Data: diff + surrounding code (read changed files in full when needed). **Model: Opus.**

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
- Stringly-typed domain enum (the same set of string literals —
  e.g. action names, statuses, modes — scattered across a switch,
  an options list, and a payload, with no shared enum/const/union
  backing them)

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

## Phase 3: Issue Scoring (Sonnet)

Score EVERY issue from Phase 2. Cap at 20.

**Cap sort order (when >20 issues):**

1. `severity = "important"` before `severity = "nit"`.
2. Tie-break by lens order: 1 (Rules) → 2 (Bug-scan) → 3 (Deps/Types) → 4 (History) → 5 (Architecture) → 6 (Inline Guidance).
3. Final tie-break: file path, then line number.

Above the inline threshold, fan out as parallel Sonnet subagents; at or below, inline scoring is fine — but scoring is not optional and the rubric below is mandatory.

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

LINE RESOLUTION (do this first, every issue):
- Open the actual changed file and locate the cited line in the
  post-change file (not the diff position — see "Line numbers" in the
  Execution Contract).
- If the line matches the finding, keep it. If it's off, correct
  `line` to the real one. If the cited code can't be located at all,
  the finding is a false positive → score 0 and drop it.

VERIFICATION:
- Rule-based: re-read rule, confirm wording.
- Bug: trace code path, confirm it can occur.
- Dependency: check surrounding code handles case.
- Architectural: confirm the smell describes a real coupling / surface
  problem, not just an unfamiliar pattern.

BUSINESS-DEPENDENT CAP:
- If confirming the finding as a *bug* would require business rules,
  domain knowledge, or backend contracts the reviewer cannot see in the
  code, cap the score at 89 (Concern) — never Critical. Phrase it as a
  question, not an assertion ("two definitions of 'active' disagree —
  which is intended?"), and never state the user-facing consequence as
  fact.
- Reserve Critical (≥90) for issues verifiable purely from the code: a
  provable crash, an explicit rule violation, or a self-contradiction
  with no business unknown.

Output: { "score": 75, "line": <resolved line>, "reasoning": "..." }
```

---

## Phase 4: Filter, Format & Synthesize

### Filter

- Keep score ≥ 50
- Zero remaining → output "No issues found" (still emit Considered & cleared + Summary)

### De-dupe (one root issue = one finding)

- Collapse findings that share a root cause into a single finding, even
  across lenses. If the same problem manifests in several files, list
  every location under that one finding (`[a.ts:10, b.ts:42]`); do not
  emit a second finding that points back at the first.
- Never restate a finding in more than one section, and never write
  "see above" — say it once, in the highest-severity place it belongs.

### Synthesize (no extra subagent — done by the consolidator from material already gathered)

- **Considered & cleared:** from the lens material, list up to 5 concrete near-misses the review checked and deliberately did NOT flag, each with a one-line reason it's actually fine (e.g. "Raw `<v-data-table>` is correct here — in-memory selection, DynamicDataTable would be wrong"). These pre-empt reviewer objections; they are not praise. Tie each to the diff. Omit the section if there were no real near-misses — do not pad with generic compliments.
- **Fix order:** order the kept Critical + Concern findings into a numbered must-fix list (Criticals first, then Concerns by score). Group trivially-related fixes onto one line. Nits are excluded.

### Group

- Critical: ≥ 90 (must-fix; breaks correctness, security, or an explicit rule)
- Concerns: 75-89 (real issues, including strong architectural smells)
- Nits: 50-74 (low impact, mild smells, judgment calls)

### Writing findings (style)

- **One finding = one claim.** No multi-clause compound headlines, no nested sub-claims stacked into the bullet. If a bullet needs two claims, it's two findings (or it's wrong).
- **Headline is one plain-language sentence** at the density of a senior reviewer's inline comment, not a spec paragraph. Push detail into Evidence/Fix.
- **Evidence cites, doesn't paste.** Render the rule as a short citation (`rule 4.13`, `gaps.md §1`) plus the operative clause only — never the full rule paragraph. (Lens 1 still quotes verbatim internally for fidelity; that quote does not reach the output in full.)
- **Doc/precedent anchor.** When a `RULES_FILE`, repo doc, or prior PR resolves the finding, append the source anchor to the line (`— rules 4.13`, `— gaps.md §1`, `— pr_98495`). Cheap — the path/ref is already on the issue from its lens.

### Format

```markdown
# {TITLE}

<!-- Metadata block: emit only the lines whose values are non-empty.
     If all four are empty, omit the entire block (and its trailing blank line). -->

- PR: #{PR}
- Ticket: {TICKET}
- Branch: {BRANCH}

**Files changed:** X | **Issues:** X critical, X concerns, X nits

## Critical (score ≥90)

- **[file:line]** One-sentence issue _({lens})_ — {anchor}
  - **Evidence:** {short citation + operative clause / commit ref / comment / design smell}
  - **Fix:** ...

## Concerns (score 75-89)

- **[file:line]** One-sentence issue _({lens})_ — {anchor}
  - **Evidence:** ...
  - **Fix:** ...

## Nits (score 50-74)

- **[file:line]** One-sentence issue — one-line fix _({lens})_ — {anchor}

## Considered & cleared

<!-- Up to 5 concrete near-misses the review checked and deliberately did not flag, each with the one-line reason it's fine. Omit the whole section if there were none. Not praise. -->

- ...

## Summary

- **Recommendation:** approve | request-changes | needs-discussion
- **Suggested fix order:**
  1. ...
  2. ...
- **Risk areas:** ...
```

`{lens}` is the issue's `lens` field, verbatim. `{anchor}` is the doc/precedent source — drop the trailing `— {anchor}` entirely when there is none. Skip metadata lines whose value is empty; if all three are empty, drop the block.

---

## Error Handling

- **Failed lenses:** skip, continue, log warning. Partial review > none.
- **Large diffs (>50 files):** caller already warned in detection step.
- **Missing rules:** abort (Step 1.0).
- **Unparseable files:** auto-skip binary/minified/generated.

## Notes

- Lenses defined by data source — no overlap.
- Rules passed as paths; lenses read directly. No paraphrasing internally; output cites, not pastes (Phase 4).
- **Bug coverage is non-deterministic across single runs.** Convention/rule findings converge run-to-run; logic-bug findings do not — a real bug may surface in one run and not the next. Lens 2's "concrete trigger" gate raises precision, but does not eliminate the miss rate. Do not treat one clean run as proof the code is bug-free; for high-stakes logic, run twice or review the conditional hunks by hand.
