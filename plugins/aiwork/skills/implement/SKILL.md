---
name: implement
description: Implement a single ticket or a small inline change in one pass, in this session.
disable-model-invocation: true
argument-hint: [ticket-path-or-description]
---

# Implement

Follows the `aiwork-protocol` skill. Don't enter plan mode — the ticket is the plan. One work item, one pass, this session; for a whole spec with a ticket graph use `/implement-spec`.

## Resolve input

`$ARGUMENTS` is one of:

- **Ticket path**: use directly. Verify the ticket is `status: ready` and every `blocked_by` ticket is `status: done`; if not, warn and ask.
- **Inline description**: if trivial (fits one session, obvious approach), treat it as the work item. If non-trivial, stop and suggest `/to-spec`.
- **Spec/PRD or task folder path**: stop and suggest `/implement-spec`.

## Do

1. Set ticket `status: in-progress` (if working from a ticket).
2. Implement. Use `/tdd` where possible, at the seams recorded in the spec's Testing Decisions section.
3. Run `/simplify` — skip only when the change was a small mechanical edit.
4. Run `/verify`. Then confirm each acceptance criterion against actual behavior. Check off `- [ ]` → `- [x]`; set ticket `status: done`.
5. Run `/code-review low --fix`.
6. Commit. Do not ask. Report what was done and anything left open.

If a deliberate decision or important note for the maintainer comes up (spec ambiguity resolved, intentional deviation, tradeoff, open question), record it in the task folder's `implementation-notes.md` per `aiwork-protocol`.
