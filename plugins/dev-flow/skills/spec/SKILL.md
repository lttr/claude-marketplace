---
name: df:spec
description: This skill should be used when the user wants to generate an implementation specification from triage output and clarifying questions. Trigger when user says "write spec", "create spec", "generate spec", or after completing a triage when the user wants to proceed to spec writing. The skill asks structured questions about decisions, then generates a detailed implementation spec with dependency graphs, migration details, and acceptance criteria.
---

# Implementation Spec Generator

Transform triage output and user decisions into a detailed implementation specification ready for development.

## Workflow

### 1. Gather Input

The skill expects one of:

- **Triage file path** - Read from `.aiwork/triage/<ticket>.md`
- **Ticket ID** - Fetch from Azure DevOps, then locate or create triage
- **Continue from triage** - Use context from just-completed triage session

Extract from triage:

- Ticket metadata (ID, title, type, assignee)
- Scope (files/components in scope)
- Dependencies identified
- Open questions
- Technical context gathered

### 2. Ask Clarifying Questions

Use `AskUserQuestion` tool to gather decisions. Organize questions into batches of 3-4 max.

**Standard question categories:**

#### Architecture Decisions

- Target location (which layer/module)
- API style (Composition API vs Options API for Vue)
- TypeScript strictness level

#### Dependencies

- Blocking dependencies (wait vs include vs parallel)
- Shared code ownership

#### Implementation Approach

- Migration strategy (in-place vs move)
- Compatibility layer needs (re-exports, aliases)
- Library choices (keep vs replace)

#### Process

- PR strategy (single vs multiple)
- Testing requirements
- Manual QA scope

Mark questions that need team input (can't be answered by assignee alone).

### 3. Explore Technical Details

If not already done in triage, use Explore agent to gather:

- Current component structure and props/interfaces
- Consumer files (who imports these components)
- Related patterns in codebase
- Existing tests

### 4. Generate Spec

Write to `.aiwork/specs/<ticket-id>-<slugified-title>.md`

Use the template from `assets/spec-template.md`.

## Question Templates

### Architecture Questions

```
"Where should <component> live after migration?"
Options:
- "<layer-a> (Recommended)" - <rationale>
- "<layer-b>" - <rationale>
- "Keep in current location" - <rationale>
```

### Dependency Questions

```
"Should <dependency> be completed first, or included in this task?"
Options:
- "Wait for <ticket>" - Block until dependency completes
- "Include in this task" - Expand scope to include it
- "Parallel work OK" - Proceed independently, coordinate later
```

### Implementation Questions

```
"<Technology> approach?"
Options:
- "<Option A> (Recommended)" - <rationale>
- "<Option B>" - <rationale>
```

## Tips

- Front-load blocking questions - get team-decision items identified early
- Generate dependency graph even for simple tasks - makes order explicit
- Include code snippets for non-obvious transformations
- List ALL consumer files - prevents forgotten import updates
- Keep "Noted Improvements" separate - avoids scope creep
- Acceptance criteria should be checkboxes - easy to verify completeness
