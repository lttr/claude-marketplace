---
name: triage
description: Triage requirements, specs, or tickets. Detect input (Azure DevOps ticket id/URL, pasted text, markdown path, or empty prompt). Explore codebase + docs, score completeness, ask clarifying questions, save markdown report. Trigger when user says "triage", "review this spec", "is this requirement complete", or provides a ticket/spec to assess.
---

# Triage

Analyze requirements for completeness. Explore code + docs, surface gaps, ask clarifying questions, save report.

## Input Detection

Argument is `$ARGUMENTS`.

| Form                                  | Source                          |
| ------------------------------------- | ------------------------------- |
| empty                                 | prompt user to paste / describe |
| numeric (`12345`)                     | Azure DevOps work item id       |
| URL containing `_workitems/edit/<id>` | Azure DevOps URL → extract id   |
| path ending `.md`                     | local markdown spec file        |
| anything else                         | treat as pasted text            |

Ambiguous → ask. Do NOT guess.

## Workflow

### 1. Resolve input

#### empty

Prompt: "Paste requirements / spec text, or give a ticket id, URL, or .md path."

#### Azure DevOps id / URL

Invoke `az-cli` skill for reference, then:

```bash
az boards work-item show --id <id> --expand all -o json
```

Extract title, description, acceptance criteria, state, type, assignedTo, areaPath, iterationPath, relations. HTML descriptions → readable text.

**Always search Confluence** (Atlassian MCP tools) for related docs:

- by ticket title keywords
- by area path / feature name
- by domain terms from description
- additional terms from `$ARGUMENTS` if provided

Look for: technical specs, ADRs, related-feature docs, business rules, prior decisions.

#### `.md` path

Read file. Use file content as input. Title from H1 or filename.

#### pasted text

Use as-is. Derive title from first line / sentence.

### 2. Explore codebase + docs

#### Codebase (Explore agent)

- Project structure / architecture
- Existing code that would be modified
- Patterns and conventions
- Related features
- Test coverage patterns

#### Local docs

`docs/`, `documentation/`, `wiki/`, `README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, OpenAPI specs, ADRs, inline code comments.

### 3. Assess completeness

| Dimension               | Questions                               |
| ----------------------- | --------------------------------------- |
| **Problem clarity**     | Goal stated? Why needed?                |
| **Scope**               | In scope? Explicitly out?               |
| **User impact**         | Who benefits? Journey affected?         |
| **Acceptance criteria** | Done definition? Success metrics?       |
| **Edge cases**          | Errors? Empty states? Boundaries?       |
| **Technical scope**     | Components/files affected? API changes? |
| **Dependencies**        | Blocked by? Coordination?               |
| **Non-functional**      | Performance? Security?                  |
| **Data**                | Schema? Migration?                      |
| **UX/UI**               | Designs? Patterns?                      |

Rate: **Ready** / **Mostly Ready** / **Needs Clarification** / **Underspecified**.

### 4. Generate questions

Categories:

1. **Blockers** — must answer before any work
2. **Scope clarification** — boundaries
3. **Technical decisions** — implementation
4. **Nice to know** — non-blocking

### 5. Ask interactively

Use `AskUserQuestion`. 1–4 questions per call, 2–4 options each. Record answers. Unanswered → output file.

### 6. Write output

If `.aiwork/` protocol present, follow it. Otherwise:

```bash
mkdir -p ./.aiwork/{date}_{slug}
```

Save to `./.aiwork/{date}_{slug}/triage.md`.

`{date}` = `YYYY-MM-DD`. `{slug}` = with ticket: `<ticket-id>-<slugified-title>`, else `<slugified-title>`. Slugify: lowercase, spaces→hyphens, strip special chars, max 40 chars.

If folder already exists for this ticket/slug, place file there.

## Output Format

```markdown
# Triage: [Short title]

**Source**: [Ticket ID/URL or "Manual input"]
**Date**: [YYYY-MM-DD]
**Completeness**: [Ready | Mostly Ready | Needs Clarification | Underspecified]

## Summary

[1-sentence summary]

### Understanding

[2-3 sentences from codebase exploration]

### What's Clear

- ...

### Implicit Requirements (from docs)

- [Reqs found in docs that ticket assumes but doesn't state]

### Gaps Identified

- ...

### Questions

#### Blockers

1. [Question] — [Why it blocks]

#### Scope Clarification

1. ...

#### Technical Decisions

1. ...

#### Nice to Know

1. ...
```

Only unanswered questions go in output.

### 7. Summary to user

- File path saved
- Completeness rating
- Blocker count

## Tips

- Don't ask what code/docs already answer — explore first
- Surface implicit requirements from docs — tickets assume documented knowledge
- 3 critical questions > 10 nice-to-haves
- Frame to unblock decisions, not gather trivia
- Docs contradict ticket → blocker question
