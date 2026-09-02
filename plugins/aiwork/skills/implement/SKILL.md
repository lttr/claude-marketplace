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
3. Tidy the diff yourself — naming, duplication, dead scaffolding. Not `/simplify`: its reviewers would rediscover context you already have. Skip for a mechanical edit.
4. Run the project's check command (see its scripts). Green before anything below.
5. Run `/verify <ticket-path>` so it verifies the ticket's acceptance criteria, not just the diff. Check off `- [ ]` → `- [x]` for each criterion it passed.
6. Run `/code-review low --fix`. Re-run the checks if it changed code.
7. Set ticket `status: done` and `verified:` to the passes that ran (`checks`, `behaviour`, `review`), then commit. Do not ask. Report what was done and anything left open.

Record a note in the task folder's `implementation-notes.md` per `aiwork-protocol` when the reader must act on it: work only a human can finish, anything left unverified, a spec ambiguity you resolved, a deliberate deviation. A few sentences, never a log of what you built. Nothing to note is the normal case.
