# Vue Component Best Practices

These patterns apply to Vue 3+ and modern Nuxt applications.

## Script Setup Syntax

ALWAYS use `<script setup lang="ts">` for component script sections.

### Props

- ALWAYS use TypeScript type-based syntax for `defineProps()` instead of runtime `PropType` declarations
- ALWAYS destructure props directly from `defineProps()` to maintain reactivity and enable inline defaults
- If no props are used in the script section, call `defineProps()` without destructuring

```typescript
// ✅ Correct: Type-based with destructuring and inline defaults
<script setup lang="ts">
const { title, count = 0, enabled = true } = defineProps<{
  title: string
  count?: number
  enabled?: boolean
}>()
</script>

// ✅ Correct: No props used in script
<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

// ❌ Wrong: Runtime PropType syntax
import type { PropType } from 'vue'
defineProps({
  items: {
    type: Array as PropType<string[]>,
    required: true
  }
})
```

### Emits

ALWAYS use type-based syntax for `defineEmits` in TypeScript instead of runtime array syntax.

```typescript
// ✅ Correct: Type-based emits
const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

// ❌ Wrong: Runtime array syntax
const emit = defineEmits(['update', 'close'])
```

### v-model

USE `defineModel()` for v-model implementations instead of manually defining props and emits.

```typescript
// ✅ Correct: Using defineModel
const modelValue = defineModel<string>()

// ❌ Wrong: Manual prop + emit
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
```

## Component Structure

### Template Placement

ALWAYS place the `<template>` section at the top of Vue SFC files, before `<script>` and `<style>` sections.

```vue
<!-- ✅ Correct order -->
<template>
  <div>{{ title }}</div>
</template>

<script setup lang="ts">
const { title } = defineProps<{ title: string }>()
</script>

<style scoped>
div { color: blue; }
</style>
```

### Component Naming

- ALWAYS use multi-word component names except for Nuxt pages and layouts
- Examples: `UserProfile.vue`, `SearchBar.vue` (not `User.vue`, `Search.vue`)
- Exception: `pages/index.vue`, `pages/about.vue`, `layouts/default.vue` are acceptable

## Template Directives

### v-for Loops

- ALWAYS use `key` in v-for loops
- ALWAYS use `v-for="item of items"` instead of `v-for="item in items"` to match JavaScript `for...of` syntax

```vue
<!-- ✅ Correct -->
<li v-for="user of users" :key="user.id">{{ user.name }}</li>

<!-- ❌ Wrong: Missing key -->
<li v-for="user of users">{{ user.name }}</li>

<!-- ❌ Wrong: Using 'in' instead of 'of' -->
<li v-for="user in users" :key="user.id">{{ user.name }}</li>
```

### Prop Binding Shorthand

ALWAYS use shorthand syntax (`:propName`) when passing a prop with the same name as the variable, instead of verbose form (`:propName="propName"`).

```vue
<!-- ✅ Correct: Shorthand -->
<UserCard :username :avatar :bio />

<!-- ❌ Wrong: Verbose when unnecessary -->
<UserCard :username="username" :avatar="avatar" :bio="bio" />
```

## Reactivity and State

### Reactive References

PREFER `ref()` for reactive state instead of `reactive()`.

```typescript
// ✅ Preferred: Using ref
const count = ref(0)
const user = ref({ name: 'Alice', age: 30 })

// ❌ Less preferred: Using reactive
const state = reactive({ count: 0 })
```

### VueUse Composables

PREFER VueUse composables and utility functions over custom implementations for common tasks like state management, DOM interactions, and browser APIs.

Check if `@vueuse/core` or `@vueuse/nuxt` is installed before suggesting VueUse composables.

```typescript
// ✅ Preferred: Using VueUse (if installed)
import { useLocalStorage, useMouse, useWindowSize } from '@vueuse/core'
const token = useLocalStorage('auth-token', '')

// ❌ Avoid: Custom implementation when VueUse exists
const token = ref(localStorage.getItem('auth-token') || '')
watch(token, (val) => localStorage.setItem('auth-token', val))
```

## Component Organization

### Logical Grouping

PREFER to group by logical concerns rather than grouping by type (data, methods, computed) within components. Keep related state, computed properties, and functions together.

```typescript
// ✅ Preferred: Grouped by feature/concern
<script setup lang="ts">
// User authentication concern
const user = ref(null)
const isAuthenticated = computed(() => !!user.value)
async function login() { /* ... */ }

// Search functionality concern
const searchQuery = ref('')
const searchResults = computed(() => /* ... */)
function handleSearch() { /* ... */ }
</script>

// ❌ Less preferred: Grouped by type
<script setup lang="ts">
// All refs
const user = ref(null)
const searchQuery = ref('')

// All computed
const isAuthenticated = computed(() => !!user.value)
const searchResults = computed(() => /* ... */)

// All functions
async function login() { /* ... */ }
function handleSearch() { /* ... */ }
</script>
```
