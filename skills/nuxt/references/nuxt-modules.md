# Nuxt Modules Reference

Check package.json for installed modules before suggesting module-specific features.

## Image Optimization (@nuxt/image)

**Check:** `@nuxt/image` in package.json

### NuxtImg Component

```vue
<NuxtImg
  src="/images/hero.jpg"
  width="800"
  height="600"
  alt="Hero image"
  loading="lazy"
  fit="cover"
/>
```

### NuxtPicture for Responsive Images

```vue
<NuxtPicture
  src="/images/hero.jpg"
  :img-attrs="{ alt: 'Hero image' }"
  sizes="sm:100vw md:50vw lg:400px"
/>
```

## Content Management (@nuxt/content)

**Check:** `@nuxt/content` in package.json

### Query Content

```typescript
// List all articles
const { data: articles } = await useAsyncData('articles', () =>
  queryContent('/articles').find()
)

// Get single article
const { data: article } = await useAsyncData('article', () =>
  queryContent('/articles').where({ slug: route.params.slug }).findOne()
)
```

### ContentDoc Component

```vue
<template>
  <ContentDoc />
</template>
```

## Icon Management (@nuxt/icon)

**Check:** `@nuxt/icon` in package.json

### Icon Component

```vue
<Icon name="heroicons:home" size="24" />
<Icon name="mdi:github" class="text-2xl" />
```

## UI Components (@nuxt/ui)

**Check:** `@nuxt/ui` in package.json

Provides pre-built components with Tailwind CSS:

```vue
<UButton label="Click me" color="primary" />
<UInput v-model="name" placeholder="Enter name" />
<UModal v-model="isOpen">
  <UCard>
    <template #header>Modal Title</template>
    <p>Modal content</p>
  </UCard>
</UModal>
```

## SEO (@nuxtjs/seo)

**Check:** `@nuxtjs/seo` in package.json

Provides SEO utilities including sitemap, robots.txt, and OG images.

```typescript
// Auto-generates sitemap
// Configure in nuxt.config.ts
export default defineNuxtConfig({
  site: {
    url: 'https://example.com',
    name: 'My Site'
  }
})
```

## Internationalization (@nuxtjs/i18n)

**Check:** `@nuxtjs/i18n` in package.json

### Basic Usage

```vue
<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>
    <NuxtLink :to="switchLocalePath('fr')">Français</NuxtLink>
  </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

// Translation
const greeting = t('welcome')

// Navigate with locale
navigateTo(localePath('/about'))
</script>
```

## Tailwind CSS (@nuxtjs/tailwindcss)

**Check:** `@nuxtjs/tailwindcss` in package.json

Auto-configured Tailwind CSS integration. Use classes directly:

```vue
<template>
  <div class="container mx-auto px-4">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
      Hello World
    </h1>
  </div>
</template>
```

## Color Mode (@nuxtjs/color-mode)

**Check:** `@nuxtjs/color-mode` in package.json

### Toggle Dark Mode

```vue
<script setup lang="ts">
const colorMode = useColorMode()

function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button @click="toggleDark">
    {{ colorMode.value === 'dark' ? '🌞' : '🌙' }}
  </button>
</template>
```

## ESLint (@nuxt/eslint)

**Check:** `@nuxt/eslint` in package.json

Provides auto-configured ESLint with Nuxt-specific rules. Configuration in `eslint.config.mjs`:

```javascript
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    stylistic: true,
  }
})
```

## Security (nuxt-security)

**Check:** `nuxt-security` in package.json

### Security Headers

Automatically applies security headers. Configure in nuxt.config.ts:

```typescript
export default defineNuxtConfig({
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'https:', 'data:'],
      },
    },
    rateLimiter: {
      tokensPerInterval: 150,
      interval: 'hour',
    }
  }
})
```

## Fonts (@nuxt/fonts)

**Check:** `@nuxt/fonts` in package.json

Automatically optimizes and loads fonts:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' }
    ]
  }
})
```

```vue
<style>
.text {
  font-family: 'Inter', sans-serif;
}
</style>
```

## Scripts (@nuxt/scripts)

**Check:** `@nuxt/scripts` in package.json

Load third-party scripts efficiently:

```vue
<script setup lang="ts">
useScript({
  src: 'https://www.googletagmanager.com/gtag/js',
  async: true
})
</script>
```
