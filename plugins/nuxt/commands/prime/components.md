---
description: Load Vue component patterns and best practices
---

# Vue Component Priming

Load comprehensive Vue component development context:

## Composition API Patterns
- `<script setup>` syntax
- Reactive state with `ref()` and `reactive()`
- Computed properties and watchers
- Lifecycle hooks (`onMounted`, `onUnmounted`, etc.)
- Template refs and component references
- `defineProps()`, `defineEmits()`, `defineModel()` (type-based)

## Component Architecture
- Single File Component (SFC) structure
- Props and emits patterns
- v-model binding patterns
- Slot usage and scoped slots
- Component composition strategies
- Provide/inject for dependency injection

## Vue Best Practices
Load patterns from `skills/nuxt/references/vue-best-practices.md`:
- Template organization (template-first structure)
- Reactivity patterns (prefer `ref()` over `reactive()`)
- Type safety with TypeScript
- Component naming conventions (multi-word names)
- Template directives best practices
- Event handling patterns
- Performance optimization (computed vs methods, v-once, v-memo)

## Conditional VueUse Loading
Check if `@vueuse/core` or `@vueuse/nuxt` is in `package.json`:
- **If installed:** Load `skills/nuxt/references/vueuse.md` for composable utilities
- **If NOT installed but user requests it:** Suggest installation and load reference
- **If NOT installed and not requested:** Skip VueUse reference

## VueUse Composables (when available)
Common patterns to leverage:
- State: `useToggle`, `useCounter`, `useLocalStorage`, `useSessionStorage`
- DOM: `useMouse`, `useScroll`, `useElementVisibility`, `useIntersectionObserver`
- Browser: `useClipboard`, `useMediaQuery`, `useDark`, `useGeolocation`
- Utilities: `useDebounce`, `useThrottle`, `useInterval`, `useTimeout`

Focus on Vue component authoring with emphasis on Composition API and TypeScript type safety.
