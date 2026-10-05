# grill-with-docs

Adapted from Matt Pocock's [`skills`](https://github.com/mattpocock/skills) collection
(synced against v1.3.1).

## Local changes from upstream

- **One self-contained skill.** Upstream splits this into a thin wrapper that loads
  the `grilling` and `domain-modeling` skills. Here the grilling loop, the domain
  modeling and the format files all live in this one skill.
- **Probes the technical shape.** Beyond domain language, the design tree covers
  libraries and dependencies, code placement, and data/API contracts. The library
  research is delegated to a subagent, and the session never ends with an unnamed
  "we'll use some library".
- **Greps `docs/` for context during grilling.** Beyond `GLOSSARY.md` and ADRs,
  the skill `rg`s other markdown (design notes, architecture, runbooks) for the
  terms a question touches and reads only the hits — no wholesale reads. Those
  docs are context to challenge against, not authoritative; only `GLOSSARY.md`
  and ADRs are law.
- **Plain question format.** Rounds use a `**Q1** - **title**` heading and a
  `Recommended:` line instead of upstream's emoji markers and `---` separators.
- **User-invoked only.** Like every aiwork workflow skill, it carries
  `disable-model-invocation: true`.
