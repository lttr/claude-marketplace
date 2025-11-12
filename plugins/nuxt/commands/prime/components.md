---
description: Comprehensive Vue patterns - script setup, props/emits/v-model, reactivity, lifecycle, slots, performance, template directives
---

# Vue Component Priming

> **Note:** This command references the `nuxt:nuxt` skill for progressive disclosure of additional Vue patterns and library-specific documentation.

## Script Setup Syntax

ALWAYS use `<script setup lang="ts">` for component script sections.

### Props

ALWAYS use TypeScript type-based syntax for `defineProps()`:

```typescript
// ✅ Correct: Type-based with destructuring and inline defaults
const { title, count = 0, enabled = true } = defineProps<{
  title: string
  count?: number
  enabled?: boolean
}>()

// ✅ Correct: No props used in script
defineProps<{
  title: string
}>()

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

ALWAYS use type-based syntax for `defineEmits`:

```typescript
// ✅ Correct: Type-based emits
const emit = defineEmits<{
  update: [value: string]
  close: []
}>()

// ❌ Wrong: Runtime array syntax
const emit = defineEmits(['update', 'close'])
```

### Event Handler Typing

When emitting events with event objects, use appropriate event types:

```typescript
// ✅ Correct: Typed event handlers
const emit = defineEmits<{
  click: [event: MouseEvent]
  keypress: [event: KeyboardEvent]
  input: [event: InputEvent]
  submit: [event: SubmitEvent]
}>()

// Usage in template
<button @click="emit('click', $event)">Click me</button>
<input @keypress="emit('keypress', $event)" />
```

### v-model

USE `defineModel()` for v-model implementations:

```typescript
// ✅ Correct: Using defineModel
const modelValue = defineModel<string>()

// With options
const modelValue = defineModel<string>({ required: true })

// ❌ Wrong: Manual prop + emit
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
```

## Component Structure

### Template Placement

ALWAYS place `<template>` section first, before `<script>` and `<style>`:

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
- Exception: `pages/index.vue`, `pages/about.vue`, `layouts/default.vue`

## Template Directives

### v-for Loops

ALWAYS use `key` in v-for loops and prefer `of` over `in`:

```vue
<!-- ✅ Correct -->
<li v-for="user of users" :key="user.id">{{ user.name }}</li>

<!-- ❌ Wrong: Missing key -->
<li v-for="user of users">{{ user.name }}</li>

<!-- ❌ Wrong: Using 'in' instead of 'of' -->
<li v-for="user in users" :key="user.id">{{ user.name }}</li>
```

### Prop Binding Shorthand

ALWAYS use shorthand syntax when passing props with same name as variable:

```vue
<!-- ✅ Correct: Shorthand -->
<UserCard :username :avatar :bio />

<!-- ❌ Wrong: Verbose when unnecessary -->
<UserCard :username="username" :avatar="avatar" :bio="bio" />
```

## Reactivity and State

### Reactive References

PREFER `ref()` for reactive state instead of `reactive()`:

```typescript
// ✅ Preferred: Using ref
const count = ref(0)
const user = ref({ name: 'Alice', age: 30 })

// ❌ Less preferred: Using reactive (loses reactivity on destructure)
const state = reactive({ count: 0 })
```

### Auto-Imported Vue APIs

Never manually import these in Nuxt projects - they're auto-imported:

**Reactivity:**
- `ref` - Reactive primitive values
- `reactive` - Reactive objects
- `computed` - Computed values
- `watch` - Watch reactive values

**Lifecycle:**
- `onMounted` - Component mounted
- `onUnmounted` - Component unmounted
- `onBeforeMount`, `onBeforeUnmount`, etc.

**Component APIs:**
- `defineProps` - Define props (type-based)
- `defineEmits` - Define emits (type-based)
- `defineModel` - Define v-model (type-based)

**Utilities:**
- `useId` - Generate unique IDs for accessibility/form elements (SSR-safe)

## Component Organization

### Logical Grouping

PREFER to group by logical concerns rather than by type:

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

## Styling Strategy

**Check `package.json` for `@nuxtjs/tailwindcss`:**

### If Tailwind Installed

```vue
<template>
  <div class="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800">
    <!-- Use Tailwind utilities -->
    <!-- Arbitrary variants: [&::-webkit-scrollbar]:w-1.5 -->
    <!-- Custom properties: @theme directive -->
  </div>
</template>
```

### If NO Tailwind

```vue
<style scoped>
.container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
</style>
```

## VueUse Composables (If Installed)

Check `package.json` for `@vueuse/core` or `@vueuse/nuxt`:

PREFER VueUse composables over custom implementations for common tasks:

```typescript
// ✅ Preferred: Using VueUse (if installed)
import { useLocalStorage, useMouse, useWindowSize } from '@vueuse/core'
const token = useLocalStorage('auth-token', '')

// ❌ Avoid: Custom implementation when VueUse exists
const token = ref(localStorage.getItem('auth-token') || '')
watch(token, (val) => localStorage.setItem('auth-token', val))
```

### Common VueUse Patterns

**State:**
- `useToggle`, `useCounter`, `useLocalStorage`, `useSessionStorage`

**DOM:**
- `useMouse`, `useScroll`, `useElementVisibility`, `useIntersectionObserver`, `useResizeObserver`

**Browser:**
- `useClipboard`, `useMediaQuery`, `useDark`, `usePreferredDark`, `useGeolocation`

**Utilities:**
- `refDebounced`, `useDebounceFn`, `refThrottled`, `useThrottleFn`, `useInterval`, `useTimeout`

The `nuxt:nuxt` skill provides detailed VueUse reference when installed.

## Accessibility

- Use semantic HTML: `<button>`, `<nav>`, `<main>`, `<article>`
- Add ARIA attributes to interactive elements
- Ensure keyboard navigation (tab order, enter/space handlers)

## TypeScript Types

- Place component prop interfaces in same file or `/types` directory
- Use PascalCase: `ButtonProps`, `CardProps`, `UserState`
- Never use `as any` - prefer type guards or `as unknown as Type`

## Performance Patterns

### Computed vs Methods

Use `computed()` for derived state (cached):

```typescript
// ✅ Cached, only recalculates when dependencies change
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

// ❌ Recalculates on every render
const getFullName = () => `${firstName.value} ${lastName.value}`
```

### Static Content

Use `v-once` for static content that never changes:

```vue
<div v-once>
  <h1>Static Header</h1>
  <p>This content never changes</p>
</div>
```

### Expensive Lists

Use `v-memo` for expensive lists with stable data:

```vue
<div v-for="item of list" :key="item.id" v-memo="[item.id]">
  <!-- Expensive rendering -->
</div>
```

## Template Best Practices

### Conditional Rendering

- Use `v-show` for frequent toggles
- Use `v-if` for conditional rendering

```vue
<!-- Frequent toggling: keep in DOM -->
<div v-show="isVisible">Toggle me often</div>

<!-- Conditional: add/remove from DOM -->
<div v-if="hasPermission">Render only when needed</div>
```

### Event Handling

```vue
<!-- Inline handlers for simple cases -->
<button @click="count++">Increment</button>

<!-- Method refs for complex logic -->
<button @click="handleSubmit">Submit</button>

<!-- Modifiers -->
<button @click.prevent="handleClick">Prevent Default</button>
<input @keyup.enter="handleEnter" />
```

### Slots

```vue
<!-- Basic slot -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<!-- Named slots -->
<template>
  <div class="card">
    <header><slot name="header" /></header>
    <main><slot /></main>
    <footer><slot name="footer" /></footer>
  </div>
</template>

<!-- Scoped slots -->
<template>
  <ul>
    <li v-for="item of items" :key="item.id">
      <slot :item="item" />
    </li>
  </ul>
</template>
```

## Provide/Inject

For dependency injection:

```typescript
// Parent component
provide('theme', 'dark')
provide('api', apiClient)

// Child component (any depth)
const theme = inject('theme')
const api = inject('api')

// With TypeScript
import type { InjectionKey } from 'vue'

interface Theme {
  mode: 'light' | 'dark'
}

const themeKey: InjectionKey<Theme> = Symbol('theme')

// Provide
provide(themeKey, { mode: 'dark' })

// Inject
const theme = inject(themeKey)
```

## Lifecycle Hooks

```typescript
// Setup (reactive state initialization)
const count = ref(0)

// Mounted (DOM available)
onMounted(() => {
  console.log('Component mounted')
})

// Before unmount (cleanup)
onBeforeUnmount(() => {
  // Remove event listeners, clear timers, etc.
})

// Unmounted
onUnmounted(() => {
  console.log('Component unmounted')
})

// Watch effect (runs immediately and on dependencies change)
watchEffect(() => {
  console.log(`Count is ${count.value}`)
})

// Watch specific value
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})
```

## Template Refs

```vue
<template>
  <input ref="inputRef" />
  <MyComponent ref="componentRef" />
</template>

<script setup lang="ts">
const inputRef = ref<HTMLInputElement>()
const componentRef = ref<InstanceType<typeof MyComponent>>()

onMounted(() => {
  inputRef.value?.focus()
})
</script>
```
