# maintenance

Repository upkeep: the chores that rot quietly if nobody runs them. Both skills are conservative by design — they report with evidence, and they never rewrite anything you did not ask them to.

## Skills

| Skill               | Invocation                                 | What it does                                                                                                                                          |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs-checker`      | `/maintenance:docs-checker [paths...]`     | Audit `CLAUDE.md`, the `.claude/` tree, READMEs and docs for broken references and verifiably stale content. Reports findings; fixes only on request. |
| `dependency-update` | `/maintenance:dependency-update [dry-run]` | One dependency update run → at most one reviewable PR. `dry-run` reports what it would do without touching anything.                                  |

Both are explicit-invocation only. Neither auto-triggers.

## docs-checker

Two passes:

- **Deterministic.** `scripts/docs-check.mjs` (zero dependencies, Node >= 22) checks markdown links, image assets and backticked source paths against the working tree, resolving tsconfig/`package.json` aliases. `--repo=NAME:DIR` covers docs that reference a sibling checkout. Its findings are ground truth.
- **Semantic.** A bounded review of `CLAUDE.md`, the `.claude/` tree and top-level READMEs, looking only for claims that can be verified against the repo right now. Every finding cites the file and line that proves it stale; anything that cannot be proven is listed as unverified rather than asserted.

Inline suppressions are honored: `<!-- docs-check-ignore -->` on a line, `<!-- docs-check-disable -->` … `<!-- docs-check-enable -->` around a region, and `--no-agent-docs` to skip the agent-context scan entirely.

## dependency-update

The run is a judgement call end to end, with one deterministic step. `scripts/dep-scan.mjs` detects the repo root from git and the package manager from the lockfile (pnpm and npm; yarn and bun are reported as unsupported so you do that pass by hand), then emits JSON: one row per outdated direct dependency per workspace, with the declared range, the semver bump kind (0.x-aware), the GitHub repo for release-note lookup, and whether the row is in scope at all.

Out-of-scope rows — exact pins, `catalog:` and `npm:` aliases, packages covered by an override — are reported, never bumped. That is what keeps a load-bearing pin from being quietly widened by a routine run.

What the skill then does with that scan:

- Reads release notes only where they pay off, with a tag-to-package guard for monorepos and a fallback to the real changelog when notes are thin.
- Batches majors whose breaking changes provably do not touch the codebase, recording the search that proved it. A major that needs real code changes gets its own PR, at most one per run.
- Flags packages installed at two or more majors, where install order rather than the lockfile decides which copy a bare import resolves to.
- Verifies with the project's own full gate, and bisects within hard bounds — at most 2 drops and 3 verify cycles — before handing over with the failure quoted at the top of the PR body.
- Ends with a mandatory **Not verified** section. A PR claiming everything is fine is a failure of the skill.

### It deliberately knows nothing about your project

The skill carries the procedure and none of the specifics. Base branch, verification command, which packages must move as a group, which pins are load-bearing — it learns those from where the repo already enforces them: the comments in `pnpm-workspace.yaml`, the repo's `CLAUDE.md`, or a project skill that wraps this one.

That last option is the intended escape hatch for a repo with real toolchain constraints. Write a local skill (`nuxt-deps-update`, `monorepo-deps-update`) that states the extra rules and then defers here for the run itself. Its rules win over the defaults, and the generic skill stays generic.

The scan supports that too: `--tsconfig-paths=<glob>` correlates duplicate-major packages against the `compilerOptions.paths` of generated tsconfigs, so a framework-aware wrapper can pass its own glob without the plugin needing to know that framework exists.

## Install

```
/plugin marketplace add lttr/claude-marketplace
/plugin install maintenance@lttr-claude-marketplace
```

`docs-checker` moved here from the `cc` plugin; it is now `/maintenance:docs-checker`.
