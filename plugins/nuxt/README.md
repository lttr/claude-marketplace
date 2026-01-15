# Nuxt Claude Code Plugin

A Claude Code plugin that provides specialized guidance for Nuxt development, including Vue best practices, auto-import awareness, and library-specific patterns.

## What This Plugin Provides

This plugin includes a comprehensive **Nuxt skill** that automatically activates when working on Nuxt projects. The skill provides:

- **Vue Component Best Practices** - Modern patterns for `<script setup>`, props, emits, and reactivity
- **Nuxt Auto-Imports Awareness** - Never manually import `ref`, `useState`, `useFetch`, etc.
- **File-Based Conventions** - Guidance for pages/, components/, server/api/, layouts/, and middleware/
- **Library-Specific Patterns** - On-demand documentation for:
  - Pinia (state management)
  - VueUse (composition utilities)
  - Nuxt Modules (@nuxt/image, @nuxt/content, @nuxt/ui, etc.)
  - Drizzle ORM (database operations)
- **Official Documentation Access** - Fetches latest docs from nuxt.com/llms.txt when needed

## Installation

### From GitHub

```bash
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
```

### Local Testing

```bash
/plugin marketplace add /path/to/claude-marketplace
/plugin install nuxt@lttr-claude-marketplace
```

## Usage

Once installed, the Nuxt skill automatically triggers when:

- Working in a project with `nuxt` in package.json
- Editing `.vue` files
- Working with Nuxt-specific files (`nuxt.config.ts`, files in `pages/`, `server/`, etc.)

The skill intelligently loads reference documentation based on what libraries are installed in your project's package.json.

## What's Included

### Skill Structure

```
skills/nuxt/
├── SKILL.md                      # Core skill with quick reference
└── references/                   # Loaded on-demand
    ├── vue-best-practices.md     # Vue component patterns
    ├── nuxt-patterns.md          # Common Nuxt recipes
    ├── pinia.md                  # State management
    ├── vueuse.md                 # VueUse composables
    ├── nuxt-modules.md           # Official Nuxt modules
    └── drizzle-db0.md            # Database with Drizzle ORM
```

### Key Features

- **Dependency Detection** - Only shows library-specific guidance for installed packages
- **Progressive Disclosure** - Loads detailed docs only when needed (efficient context usage)
- **Version Agnostic** - Supports Nuxt 3+ and future versions
- **Official Docs Integration** - Can fetch latest documentation when uncertain

## Examples

The skill enforces patterns like:

```typescript
// ✅ Correct: Type-based props with destructuring
const { title, count = 0 } = defineProps<{
  title: string
  count?: number
}>()

// ✅ Correct: v-for with 'of' and key
<li v-for="user of users" :key="user.id">{{ user.name }}</li>

// ✅ Correct: Leveraging auto-imports (no manual imports needed)
const route = useRoute()
const data = await useFetch('/api/users')
```

## Contributing

Contributions are welcome! Feel free to:

- Add new reference documentation
- Improve existing patterns
- Update for new Nuxt features
- Fix errors or outdated information

## License

MIT
