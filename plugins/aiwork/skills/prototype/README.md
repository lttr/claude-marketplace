# prototype

Adapted from Matt Pocock's [`skills`](https://github.com/mattpocock/skills) collection
(`skills/engineering/prototype`).

## Local changes from upstream

- **Collapsed into one `SKILL.md`.** Upstream splits into `LOGIC.md` and `UI.md`;
  here both shapes are short sections of a single file.
- **Standalone HTML is the default mode.** It lands in the task's `.aiwork/` folder
  under `prototype/` and stays there. Integrated (in-framework) variants are the
  exception, for when the prototype must be judged against the real app; they live
  on a `prototype/{name}` branch that is never merged.
- **Nothing is promoted.** Upstream folds the winning variant or validated logic into
  the real code; here the prototype only records a verdict and the real
  implementation is written separately.
- **User-invocable only** (`disable-model-invocation: true`).
- **Dropped `agents/openai.yaml`.** OpenAI-specific display metadata with no meaning
  in Claude Code.
