---
description: Upgrade Nuxt to latest minor/patch version, fix issues, and report changes
---

# Nuxt Minor Version Upgrade

Upgrade Nuxt within the current major version, fix any issues, and report what changed.

## Record Current Version

Read `package.json` and note the current `nuxt` version. Store it for the final report.

## Check Latest Available Version

```bash
pnpm info nuxt version
```

Compare the latest available major version with the currently installed major version. If a new major version is available (e.g., installed 3.x but latest is 4.x), inform the user that a major upgrade is available and stop. Major upgrades require a dedicated migration process.

## Run Upgrade

```bash
pnpm nuxt upgrade --dedupe
```

## Check New Version

Read `package.json` again to get the new `nuxt` version.

If version didn't change, inform user they're already on the latest version and stop.

## Research Changes

Search the web for Nuxt release notes between the old and new versions. Summarize:

- **Breaking or behavioral changes** relevant to this minor range
- **New features** worth adopting
- **Deprecations** to watch for

## Fix Issues

Run `pnpm run verify` (or `pnpm run build` if verify doesn't exist). If there are errors:

1. Analyze each error
2. Fix it
3. Re-run until clean

## Build Check

Run `pnpm run build` to confirm production build works.

## Codebase Suggestions

Based on the new features discovered earlier, scan the codebase for opportunities:

- New composables or utilities that could simplify existing code
- Deprecated patterns that should be updated
- Config options that are now available

Keep suggestions brief and actionable.

## Report

Output a summary:

```
## Nuxt Upgrade Report

**Upgraded**: {old version} → {new version}

### Key Changes
- ...

### Suggestions for This Codebase
- ...
```

## Commit

When everything passes, ask: "Run /commit `chore: upgrade nuxt {old} → {new}`?"
