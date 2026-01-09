---
description: List all available Claude Code skills
---

List all custom skills by scanning these locations:

1. **User skills**: `~/.claude/skills/*/SKILL.md`
2. **Plugin skills**: `~/.claude/plugins/cache/**/skills/*/SKILL.md`

For each skill found, extract and display:
- Skill name (from directory name or frontmatter)
- Description (from frontmatter or first paragraph)
- Source (user vs plugin name)

Use glob patterns to discover files, then read frontmatter from each SKILL.md.
