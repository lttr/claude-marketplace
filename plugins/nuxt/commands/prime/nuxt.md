---
name: prime-nuxt
description: Load Nuxt framework patterns and core module knowledge
---

# Nuxt Framework Priming

Load comprehensive Nuxt development context:

## Core Nuxt Patterns
- File-based routing (`pages/`)
- Server API routes (`server/api/`, `server/routes/`)
- Auto-imports (composables, components, utilities)
- Middleware and layouts
- SSR/SSG rendering strategies
- Error handling patterns

## Nuxt Composables
Focus on Nuxt-specific composables:
- `useState` for shared state
- `useFetch` / `useAsyncData` for data fetching
- `useRoute` / `useRouter` for navigation
- `useCookie` for cookie management
- `useHead` / `useSeoMeta` for SEO
- `useRuntimeConfig` for environment variables

## Core Nuxt Modules
Check `package.json` and load relevant reference docs for installed modules:
- `@nuxt/ui` - UI component library
- `@nuxt/image` - Image optimization
- `@nuxt/content` - File-based CMS
- `@nuxtjs/i18n` - Internationalization
- `@nuxtjs/tailwindcss` - Tailwind integration

## File Structure Conventions
- `pages/` - File-based routing
- `components/` - Auto-imported components
- `composables/` - Auto-imported composables
- `server/api/` - API endpoints
- `server/routes/` - Custom server routes
- `middleware/` - Route middleware
- `layouts/` - Layout templates
- `public/` - Static assets
- `assets/` - Build-time assets

Apply Nuxt-specific best practices from `skills/nuxt/references/nuxt-patterns.md`.
