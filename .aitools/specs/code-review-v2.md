# Code Review Skill Specification v2

## Core Problem

Current skill fails because:

1. Agents defined by category ("bugs", "security") → overlapping, vague
2. Rules paraphrased in prompts → context lost at handoff
3. Agents only read diff → miss dependencies, history, comments
4. Same agent reviews + scores → no verification step

## Design Principles

1. **Agents defined by data source, not category**
   - ❌ "Check for bugs"
   - ✅ "Read git blame, find issues from historical context"

2. **Rules passed as paths, agents read directly**
   - ❌ Skill reads rules → paraphrases in prompt
   - ✅ Skill finds rule paths → agents read files themselves

3. **Each agent has unique investigation scope**
   - No overlap between agents
   - Clear handoff of what each agent reads

4. **Separate scoring phase**
   - Review agents find issues
   - Scoring agents verify issues

---

## Phase 1: Context Gathering (Sequential, Haiku)

### Step 1.1: Collect Rule Paths

**Agent instructions:**

```
Find ALL rule files in this repo. Return JSON array of absolute paths.

Search for:
- Root CLAUDE.md
- CLAUDE.md in any subdirectory
- All files in .claude/rules/
- Linter configs: .eslintrc*, eslint.config.*, biome.json, .prettierrc*

Do not read file contents. Only return paths.
```

**Output:** `["path/to/CLAUDE.md", ".claude/rules/sfc-structure.md", ...]`

### Step 1.2: Detect Tech Stack

**Agent instructions:**

```
Detect the tech stack from config files. Return JSON.

Check:
- package.json → framework, key dependencies, scripts
- tsconfig.json → TypeScript config
- nuxt.config.ts → Nuxt version, modules
- pyproject.toml → Python deps
- go.mod → Go modules

Return: { framework, language, keyDeps, configNotes }
```

**Output:** `{ "framework": "nuxt", "language": "typescript", "keyDeps": ["vue", "keen-slider"], "configNotes": "strict mode enabled" }`

### Step 1.3: Summarize Changes

**Agent instructions:**

```
Read the diff. Return JSON summary.

Include:
- Brief summary (2-3 sentences max)
- Changed files grouped: { new: [], modified: [], deleted: [], renamed: [] }
- Imports added/removed

Do not analyze for issues yet.
```

**Output:** `{ "summary": "...", "changedFiles": {...}, "importChanges": [...] }`

---

## Phase 2: Parallel Review Agents (Sonnet)

**Common input to ALL agents:**

- Diff file path
- Rule file paths (from 1.1)
- Tech stack (from 1.2)
- Changed files list (from 1.3)

**Common false positive list (give verbatim to ALL agents):**

```
SKIP THESE - they are false positives:

- Pre-existing issues not introduced by this diff
- Issues a linter/typechecker/compiler would catch
- Style preferences NOT explicitly in rule files
- Changes on lines not modified in the diff
- Intentional changes aligned with the PR purpose
- Test files with intentionally "bad" code
- Issues silenced by ignore comments (eslint-disable, @ts-ignore, etc.)
- General quality issues (test coverage, docs) unless explicitly required in rules
- Obvious functionality changes that are intentional
```

---

### Agent 1: Rules Compliance

**Data source:** Rule files (.claude/rules/\*, CLAUDE.md)

**Instructions:**

```
Read EVERY rule file from the provided paths list.

For each rule file:
1. Extract each specific requirement/rule
2. Check if the diff violates that requirement
3. If violation found, cite EXACT rule text

IMPORTANT:
- Do NOT interpret or paraphrase rules
- Quote the rule verbatim
- If rule says "template before script", check template appears before script
- If rule is ambiguous, skip it

Output format per issue:
{
  "file": "path/to/file.vue",
  "line": 42,
  "issue": "Script appears before template",
  "ruleFile": ".claude/rules/sfc-structure.md",
  "ruleText": "SFC order MUST be: <template> → <script setup> → <style>",
  "severity": "important"
}
```

**Investigation scope:** Rule files + diff only

---

### Agent 2: Shallow Bug Scan

**Data source:** Diff only (no external files)

**Instructions:**

```
Read the diff. Check ONLY changed/added lines for:

- Null/undefined access without guards
- Off-by-one errors
- Missing .value on Vue refs
- Wrong comparison operators (= vs ==, == vs ===)
- Inverted boolean conditions
- Resource leaks (unclosed handles)
- Missing await on async calls
- Race conditions in async code

Do NOT:
- Follow imports to other files
- Check types or API signatures
- Look at unchanged code

Focus on OBVIOUS bugs only. Skip anything uncertain.

Output format per issue:
{
  "file": "path/to/file.ts",
  "line": 81,
  "issue": "Missing .value on ref in conditional",
  "why": "isAutoplayStopped is a ref but checked without .value - will always be truthy",
  "severity": "important"
}
```

**Investigation scope:** Diff only

---

### Agent 3: Dependency & Type Verification

**Data source:** Diff + imported files + type definitions

**Instructions:**

```
For each new/changed import in the diff:
1. Read the imported file/module
2. Find the function/type being used
3. Verify usage matches the API

For each function call to external code:
1. Find the definition (use LSP or grep)
2. Check parameter types match
3. Check return type is handled correctly

For composables/hooks:
1. Find the composable definition
2. Verify reactive values are passed correctly (toRef vs raw value)
3. Check if composable expects reactive or static input

Output format per issue:
{
  "file": "path/to/Component.vue",
  "line": 1370,
  "issue": "Non-reactive value passed to composable expecting reactive",
  "dependency": "useKeenSlider",
  "expectedUsage": "toRef(props, 'slidesPerPage')",
  "actualUsage": "props.slidesPerPage",
  "severity": "important"
}
```

**Investigation scope:** Diff + all imported files + type definitions

---

### Agent 4: Historical Context

**Data source:** Git blame + git log

**Instructions:**

```
For each modified file:
1. Run: git blame <file>
2. For sections with recent changes: git log -p -5 -- <file>

Look for:
- Reverted changes being reintroduced
- Patterns that were previously fixed (then broken again)
- Comments explaining WHY code was written a certain way
- Recent commits that established a pattern now being violated

Check if this change contradicts recent intentional decisions.

Output format per issue:
{
  "file": "path/to/file.ts",
  "line": 50,
  "issue": "Reintroducing pattern that was removed in abc123",
  "historicalContext": "Commit abc123 removed this because...",
  "commitRef": "abc123",
  "severity": "important"
}
```

**Investigation scope:** Git blame + git log for modified files only

---

### Agent 5: Code Comments Compliance

**Data source:** Full file content (not just diff)

**Instructions:**

```
For each modified file, read the FULL file content.

Find all comments:
- // single line
- /* multi line */
- <!-- HTML comments -->
- TODO, FIXME, HACK, NOTE, WARNING

Check if the changes:
1. Violate guidance in nearby comments
2. Remove TODOs without resolving them
3. Ignore warnings in comments
4. Break invariants described in comments

Output format per issue:
{
  "file": "path/to/file.ts",
  "line": 42,
  "issue": "Change violates comment above",
  "commentText": "// WARNING: Do not modify without updating X",
  "severity": "important"
}
```

**Investigation scope:** Full file content for modified files

---

## Phase 3: Issue Scoring (Parallel Haiku)

For EACH issue from Phase 2, launch a separate Haiku agent.

**Agent instructions:**

```
You are verifying a potential code review issue.

Issue: {issue.issue}
File: {issue.file}
Line: {issue.line}
Found by: {agent name}
Reason: {issue.why or issue.ruleText}

Rule files available: {paths from 1.1}
Relevant diff section: {context around the line}

TASK: Score this issue 0-100.

SCORING RUBRIC (use exactly):

0: False positive. Doesn't stand up to scrutiny. Pre-existing issue. Not actually a bug.

25: Might be real but unverified. If stylistic, not explicitly in any rule file.

50: Real but minor. Nitpick. Rarely hit in practice. Low impact.

75: Verified real issue. Will impact functionality. OR explicitly mentioned in rule files.

100: Definitely real. Confirmed with evidence. Will happen frequently. High impact.

VERIFICATION STEPS:
- For rule-based issues: Re-read the rule file. Confirm it actually says this.
- For bug issues: Trace the code path. Confirm the bug can actually occur.
- For dependency issues: Check if there's a watch/effect that handles reactivity.

Output: { "score": 75, "reasoning": "..." }
```

---

## Phase 4: Filter & Format

### Filtering

1. Keep only issues with score ≥ 75
2. If zero issues remain, output "No issues found"

### Grouping

- Critical: score ≥ 90
- Important: score 75-89

### Output Format

```markdown
## Code Review: {branch or PR title}

**Files changed:** X | **Issues found:** X critical, X important

### Critical Issues (score ≥90)

- **[file:line]** Issue description
  - **Evidence:** {rule text / commit ref / comment}
  - **Fix:** Suggested resolution

### Important Issues (score 75-89)

- **[file:line]** Issue description
  - **Evidence:** {rule text / commit ref / comment}
  - **Fix:** Suggested resolution

### Minor Notes (informational)

{Any observations that didn't meet threshold but worth mentioning}

### Summary

- **Recommendation:** approve | request-changes | needs-discussion
- **Risk areas:** {list if any}
```

---

## Key Improvements Summary

| Aspect              | v1 (Current)                              | v2 (This spec)                                |
| ------------------- | ----------------------------------------- | --------------------------------------------- |
| Agent definition    | By category (bugs, security, conventions) | By data source (git blame, imports, comments) |
| Rule loading        | Paraphrased in prompts                    | Paths passed, agents read directly            |
| Investigation depth | Diff only                                 | Diff + imports + history + comments           |
| Overlap             | Guidelines ≈ Conventions (redundant)      | No overlap, unique data sources               |
| Scoring             | Same agent reviews + scores               | Separate Haiku agents verify                  |
| False positives     | Implicit/vague                            | Explicit list given verbatim                  |
| Agent instructions  | General ("check for bugs")                | Specific ("check .value on refs")             |

---

## Implementation Notes

### Rule Handoff Pattern

```
Skill orchestrator:
1. Haiku finds paths: [".claude/rules/sfc.md", "CLAUDE.md"]
2. Passes paths to each Sonnet agent
3. Each agent reads rules itself
4. No paraphrasing = no information loss
```

### Agent Model Selection

| Phase       | Model  | Rationale                        |
| ----------- | ------ | -------------------------------- |
| 1.x Context | Haiku  | Simple file finding, low cost    |
| 2.x Review  | Sonnet | Complex analysis, need reasoning |
| 3.x Scoring | Haiku  | Binary decision, low cost        |

### Parallel Execution

- Phase 1: Sequential (each step needs previous output)
- Phase 2: All 5 agents in parallel
- Phase 3: All scoring agents in parallel
- Phase 4: Sequential (aggregation)

---

## Design Decisions

1. **Bug checklist:** Dynamic from tech stack. Phase 1.2 detects framework → generates framework-specific checks (Vue .value, React stale closures, etc.)
2. **Cost cap:** 15 issues max. Sort by apparent severity before scoring phase.
3. **PR history:** Yes. Agent 4 checks previous PRs via `gh pr list` for relevant review comments.
4. **Rule scope:** All `.claude/rules/*` always, regardless of which files changed.
5. **Output:** Terminal only for v2. PR comment support deferred.
6. **Large diffs:** If >50 files, warn user and ask whether to proceed or filter by priority.
7. **Score reasoning:** Hidden in output. Just show issues that passed threshold.
8. **Error handling:** Skip failed agents, continue with others. Log warning. Partial review > no review.
9. **Quick mode:** No. Always run full review. Consistency over speed.
10. **Bug patterns:** Dynamic from project sources (CLAUDE.md, eslint config, docs, rules). No hardcoded reference files.
11. **Unparseable files:** Auto-skip binary/minified/generated. No output noise.
12. **Missing rules:** Require CLAUDE.md or .claude/rules/ to exist. Abort with message if neither found.
13. **File structure:** Keep separate. Command (`df:review`) handles git/input, skill (`df:code-review`) handles review logic.
14. **Naming:** Keep `df:code-review`. No breaking change.
15. **Testing:** Manual by user. No automated test fixtures.
