---
name: nuxt
description: This skill should be used when working on Nuxt projects (v3+). Use it for building Vue applications with Nuxt's file-based routing, server-side rendering, and auto-import features. Trigger when working with .vue files, nuxt.config.ts, or when the project contains a nuxt dependency in package.json.
---

# Nuxt Development

## Overview

This skill provides specialized guidance for developing Nuxt applications (v3+), including Vue best practices, Nuxt-specific conventions, ecosystem library knowledge, and access to up-to-date documentation.

## When to Use This Skill

Trigger this skill when:
- Working in a project with `nuxt` as a dependency in package.json
- Creating or editing `.vue` single-file components
- Working with Nuxt-specific files: `nuxt.config.ts`, `app.vue`, or files in `pages/`, `components/`, `composables/`, `server/`, `layouts/`, or `middleware/` directories
- Questions about Nuxt architecture, routing, or SSR/SSG patterns

## Documentation Access

### Official Nuxt Documentation

Fetch up-to-date Nuxt documentation when needed:

```
https://nuxt.com/llms.txt
```

Fetch when:
- Uncertain about current Nuxt API syntax or conventions
- User asks about specific Nuxt features or modules
- Working with recently released Nuxt features
- Encountering Nuxt-specific errors or configuration issues
- Need to verify patterns work with the specific Nuxt version in use

## Quick Reference

### Auto-Imported APIs (No Import Needed)

Nuxt automatically imports these without explicit import statements:

**Vue APIs:** `ref`, `reactive`, `computed`, `watch`, `onMounted`, `defineProps`, `defineEmits`, `defineModel`

**Nuxt Composables:** `useState`, `useFetch`, `useAsyncData`, `useRoute`, `useRouter`, `navigateTo`, `useCookie`, `useHead`, `useSeoMeta`, `useRuntimeConfig`, `showError`, `clearError`

**Auto-imports:**
- Components from `components/` directory
- Composables from `composables/` directory
- Server utilities from `server/utils/` directory

### File-Based Conventions

**Routing:**
- `pages/index.vue` → `/`
- `pages/about.vue` → `/about`
- `pages/users/[id].vue` → `/users/:id` (dynamic route)

**Server API:**
- `server/api/users.get.ts` → `/api/users` (GET endpoint)
- `server/api/users.post.ts` → `/api/users` (POST endpoint)
- `server/routes/healthz.ts` → `/healthz` (custom route)

**Layouts & Middleware:**
- `layouts/default.vue` - Default layout
- `middleware/auth.ts` - Named middleware (use via `definePageMeta({ middleware: 'auth' })`)
- `middleware/analytics.global.ts` - Global middleware (runs on every route)

### Nuxt CLI Commands

**Development:**
- `nuxt dev` - Start development server
- `nuxt dev --host` - Expose to network

**Building:**
- `nuxt build` - Production build
- `nuxt generate` - Static site generation
- `nuxt preview` - Preview production build

**Analysis:**
- `nuxt analyze` - Bundle size analysis
- `nuxt typecheck` - Type checking
- `nuxt info` - Environment info for bug reports

## Project Dependency Detection

**Important:** Before providing library-specific guidance, check if the library is installed by examining `package.json`. Only include library-specific advice for dependencies that exist in the project.

### Core Libraries (Always Available)

- **Vue** - Component framework (auto-imported)
- **Vue Router** - Routing (file-based, managed by Nuxt)
- **Nitro** - Server engine (built into Nuxt)

### Optional Libraries to Check

Check `package.json` for these before suggesting their features:

**State & Utilities:**
- `pinia` or `@pinia/nuxt` - State management → See `references/pinia.md`
- `@vueuse/core` or `@vueuse/nuxt` - Composition utilities → See `references/vueuse.md`
- `drizzle-orm` - Database ORM → See `references/drizzle-db0.md`

**Core Nuxt Modules (Dedicated References):**
- `@nuxt/ui` - UI component library → See `references/nuxt-ui.md`
- `@nuxt/image` - Image optimization → See `references/nuxt-image.md`
- `@nuxt/content` - File-based CMS → See `references/nuxt-content.md`
- `@nuxtjs/i18n` - Internationalization → See `references/nuxt-i18n.md`
- `@nuxtjs/tailwindcss` - Tailwind CSS → See `references/tailwind.md`

**Other Nuxt Modules:**
- `@nuxt/icon`, `@nuxtjs/seo`, `@nuxtjs/color-mode` → See `references/nuxt-modules.md`
- `@nuxt/eslint`, `@nuxt/fonts`, `@nuxt/scripts`, `nuxt-security` → See `references/nuxt-modules.md`

## References

This skill includes detailed reference documentation for specific topics. Load these files as needed when working with specific features:

### Core Best Practices

**`references/vue-best-practices.md`** - Vue component patterns and conventions
- Use when writing or reviewing Vue components
- Covers: Script setup syntax, props/emits/v-model, component structure, template directives, reactivity patterns

**`references/nuxt-patterns.md`** - Common Nuxt patterns and recipes
- Use when implementing features or solving common tasks
- Covers: Data fetching, SEO/meta tags, error handling, environment config, server API routes, middleware, state management, composables, layouts, plugins

### Core Nuxt Modules (Comprehensive Documentation)

**`references/nuxt-ui.md`** - Nuxt UI component library (Last updated: 2025-01)
- Only use if `@nuxt/ui` is installed
- Covers: v3/v4 setup and migration, components (forms, buttons, modals, tables), Tailwind v4 integration, theming, validation, troubleshooting
- **Important:** Includes version-specific breaking changes and setup requirements

**`references/tailwind.md`** - Tailwind CSS in Nuxt (Last updated: 2025-01)
- Only use if `@nuxtjs/tailwindcss` is installed
- Covers: v3/v4 setup, configuration, responsive design, dark mode, custom utilities, plugins, JIT mode, performance optimization

**`references/nuxt-image.md`** - Image optimization (Last updated: 2025-01)
- Only use if `@nuxt/image` is installed
- Covers: NuxtImg/NuxtPicture components, image providers, lazy loading, responsive images, performance optimization

**`references/nuxt-content.md`** - File-based CMS (Last updated: 2025-01)
- Only use if `@nuxt/content` is installed
- Covers: Markdown/YAML content, queryContent API, components (ContentDoc, ContentList), navigation, search, pagination, syntax highlighting

**`references/nuxt-i18n.md`** - Internationalization (Last updated: 2025-01)
- Only use if `@nuxtjs/i18n` is installed
- Covers: Multi-language routing, translations, locale switching, SEO, number/date formatting, pluralization, composables

### State Management & Utilities

**`references/pinia.md`** - Pinia state management
- Only use if `pinia` or `@pinia/nuxt` is installed
- Covers: Store definition, component usage, SSR, persistence, testing

**`references/vueuse.md`** - VueUse composables
- Only use if `@vueuse/core` or `@vueuse/nuxt` is installed
- Covers: State management composables, browser APIs, element interaction, utilities, common patterns

**`references/drizzle-db0.md`** - Database with Drizzle ORM
- Only use if `drizzle-orm` is installed
- Covers: Setup, schema definition, CRUD operations, queries, joins, filtering, transactions, migrations, type safety

### Other Modules

**`references/nuxt-modules.md`** - Other official Nuxt modules
- Brief overview of: @nuxt/icon, @nuxtjs/seo, @nuxtjs/color-mode, @nuxt/eslint, @nuxt/fonts, @nuxt/scripts, nuxt-security
- For detailed guidance on @nuxt/ui, @nuxt/image, @nuxt/content, @nuxtjs/i18n, or @nuxtjs/tailwindcss, use their dedicated reference files instead

## How to Use This Skill

1. **Check dependencies** - Always examine `package.json` first to know what libraries are available
2. **Follow Vue best practices** - Apply patterns from `vue-best-practices.md` to all component code
3. **Leverage auto-imports** - Never manually import Nuxt/Vue composables that are auto-imported
4. **Use file-based conventions** - Follow Nuxt's directory structure for routing, APIs, and middleware
5. **Reference library docs** - When a library is installed, consult its reference file for specific patterns
6. **Verify version-specific features** - Reference files include "Last updated" dates; always verify with official docs for version-specific details
7. **Fetch official docs** - For recent features or uncertainty, fetch from https://nuxt.com/llms.txt or module-specific documentation URLs

### Version-Specific Information

- **Reference files with dates** (marked "Last updated: YYYY-MM") contain version-specific info
- **Always verify with official docs** when:
  - Working with modules not documented in references
  - Module version differs significantly from documentation date
  - Encountering breaking changes or migration scenarios
  - Uncertain about syntax or API for current version
- **Fallback principle:** If reference documentation doesn't match project needs, fetch official docs rather than guessing

## Important Conventions

### Component Files Must:
- Use `<script setup lang="ts">` syntax
- Place `<template>` section first, before `<script>` and `<style>`
- Use type-based `defineProps()`, `defineEmits()`, and `defineModel()`
- Use multi-word component names (except pages/layouts)
- Use `v-for="item of items"` with `:key`
- Prefer `ref()` over `reactive()`

### Nuxt Projects Should:
- Never manually import auto-imported composables
- Use `useFetch` for API calls instead of manual fetch
- Define server routes in `server/api/` with `.get.ts`, `.post.ts` naming
- Use `useState` for shared state across components
- Use `definePageMeta` for page-specific config (middleware, layout, etc.)

### When Libraries Are Installed:
- **Pinia** - Use for complex state management across many components
- **VueUse** - Prefer VueUse composables over custom implementations
- **Drizzle** - Use for type-safe database operations with full TypeScript inference
