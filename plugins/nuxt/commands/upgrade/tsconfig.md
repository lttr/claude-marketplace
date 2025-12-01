---
description: Migrate tsconfig to Nuxt v4 project references structure
---

# Upgrade tsconfig for Nuxt v4

Migrate the project's TypeScript configuration to use Nuxt v4's project references structure.

## Pre-flight Check

First, verify this is a Nuxt 4+ project:

1. Read `package.json` and check `nuxt` dependency version
2. If version is `<4.0.0`, inform user this migration is for Nuxt 4+ only and stop

## Migration Steps

### 1. Update root tsconfig.json

Replace the contents with the project references structure:

```json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" }
  ]
}
```

### 2. Delete server/tsconfig.json

If `server/tsconfig.json` exists, delete it. Nuxt v4 handles server TypeScript context through the project references.

### 3. Run nuxt prepare

After making changes, run:

```bash
nuxt prepare
```

This generates the referenced tsconfig files in `.nuxt/`.

## Verification

Run `nuxt typecheck` to verify the configuration is working correctly.
