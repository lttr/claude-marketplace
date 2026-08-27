---
name: implement-spec
description: Implement a whole spec by orchestrating subagents over its ticket graph; auto-detects the most recent task folder when no argument is given.
disable-model-invocation: true
argument-hint: [spec-or-task-folder-path]
---

# Implement Spec

Follows the `aiwork-protocol` skill. Don't enter plan mode: the spec and tickets are the plan.

## 1. Resolve input

`$ARGUMENTS` is a spec/PRD or task folder path. With no args, find the most recently modified task folder (per `aiwork-protocol` conventions). Locate the `tickets/` subfolder:

- **No tickets** → suggest `/to-tickets`, or `/implement <spec>` if the spec is small enough for one pass. Stop.
- **All tickets `done` but no `review.md`** → go straight to Wrap-up (§4).
- Nothing found → tell the user and stop.

## 2. Clarity gate

Before touching code, check the spec is concrete enough for an unattended run. **Warn and stop for confirmation** if any hold:

- Open questions, TBDs, or unresolved decisions
- Key technical choices (data model, API shape, file targets) unspecified
- Success criteria too vague to tell when "done"
- Content is contradictory, out of order, or otherwise corrupted

The gate runs **once**, against the spec, not per ticket. A badly specified ticket discovered mid-chain doesn't stop for confirmation: resolve it with best judgment and record the gap and resolution in `implementation-notes.md`.

This gate is the **last stop**. Past it, run unattended to the end.

## 3. Execution

This session acts as **orchestrator** and spawns one subagent per ticket, always, even for a lone ticket. Subagents keep the orchestrator's context clean. Parallelism is a bonus when the frontier allows it. Invoking this skill is itself the user's explicit request to spawn subagents. The `blocked_by` graph defines a **frontier** of ready tickets (`status: ready`, all blockers `done`), often several at once.

1. _(optional)_ If tickets call for codebase or documentation exploration, spawn one **exploration subagent** up front. It saves markdown notes into the task folder. Implementer subagents get a pointer to them so they can focus on implementing.
2. Spawn an **implementer subagent** for every frontier ticket, in parallel, each with its ticket path and the `<ticket-loop>` below as its instructions. When the frontier holds more than one ticket, give each subagent an isolated worktree so they don't collide. Tickets that touch dependencies or the lockfile never run in parallel with other tickets: hold them until they can run alone.
3. When a subagent returns, confirm the ticket file says `status: done` and a commit landed. Merge its worktree branch into the task branch (resolving conflicts against the spec), append its returned notes to `implementation-notes.md`, and clean up the worktree.
4. Recompute the frontier (merged work may have unblocked tickets) and spawn implementers for the newly ready ones. Repeat until no ticket remains.
5. If a ticket cannot be completed (tests won't pass, blocker discovered), let in-flight subagents finish, then stop the chain and report the state. Never mark it done.

<ticket-loop>

1. Set ticket `status: in-progress`.
2. Implement. Use `/tdd` where possible, at the seams recorded in the spec's Testing Decisions section.
3. Run `/simplify`. Skip only when the change was a small mechanical edit.
4. Run `/verify`. Then confirm each acceptance criterion against actual behavior. Check off `- [ ]` → `- [x]` and set ticket `status: done`.
5. Commit. Do not ask.

Throughout: keep `implementation-notes.md` in the task folder (an `aiwork-protocol` artifact) as a log for the maintainer. Record deliberate decisions and important notes as they happen, not at the end: design decisions where the spec was ambiguous, intentional deviations from the spec and why, tradeoffs considered, open questions, a stopped chain and why.

Never edit `implementation-notes.md` directly: the orchestrator owns it and appends the entries you return in your final report.

If a blocker forces work beyond the ticket's stated scope, make the smallest deviation that unblocks it and flag it in your returned notes. If the deviation would touch another ticket's territory, stop and return the decision to the orchestrator instead.

</ticket-loop>

## 4. Wrap-up

Runs **once**, after the last ticket, never per ticket. Skip if `review.md` exists in the task folder and no tickets finished since. Otherwise save the new review as the next number (`review_2.md`).

1. Run the full test suite plus other project checks (lint, build).
2. Review the branch (the whole diff across all ticket sessions) with `/code-review xhigh --fix`. It reviews and applies fixes in its own subagent, so the verdict comes from a fresh context: never review the diff by hand instead. When the findings come back, fix any it reported but left unapplied, then re-run the affected tests. A finding deliberately left unfixed goes into `implementation-notes.md` with the reason.
3. Save the review outcome as `review.md` per `aiwork-protocol`. Its presence marks wrap-up complete.
4. Commit remaining changes. Then report: tickets completed, commits made, review outcome, anything left open.
