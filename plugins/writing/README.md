# writing

Skills for producing text that is easy to read, plus a linter that checks drafts before they ship.

## Skills

| Skill              | Invocation                    | What it does                                                                                                                                                          |
| ------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wr`               | automatic                     | Rules for clear English prose in docs, notes, summaries, README sections, and chat answers. Ships `check-prose.ts`, a heuristic linter the skill runs on every draft. |
| `czech-typography` | automatic                     | Czech typography for the web: punctuation, dash vs. hyphen, quotes, numbers, units, non-breaking spaces, HTML entities.                                               |
| `fix-grammar`      | `/writing:fix-grammar <file>` | Fix typos and grammar in a file. Syntax errors only, no editorial or style changes.                                                                                   |
| `tldr`             | `/writing:tldr`               | Rewrite the previous response as its leanest version, three sentences or bullets at most.                                                                             |

`wr` and `czech-typography` trigger on their own when you are writing the matching kind of text. `fix-grammar` and `tldr` are manual: both act on a target you name, so automatic invocation would be wrong.

## The prose linter

`skills/wr/check-prose.ts` reads a markdown file or stdin and reports at three levels:

- **ERROR**: blacklisted phrases, em-dash splices, emoji, exclamation marks. Always fix.
- **WARN**: long sentences, oversized paragraphs, semicolon splices, flat rhythm, negative parallelism, negative echoes, staged reveals, participle tails, repeated sentence openers, a colon into three or four bare noun phrases. Fix when the flagged text really is hard to read.
- **INFO**: statistics, passive-voice hints, longer or wordier colon lists. For your judgment.

```sh
skills/wr/check-prose.ts draft.md
skills/wr/check-prose.ts - < draft.md
```

It runs under Node with native TypeScript stripping, so it needs Node 22.6 or newer (`--experimental-strip-types` on 22.x, default on 23+).

## Install

```
/plugin marketplace add lttr/claude-marketplace
/plugin install writing@lttr-claude-marketplace
```
