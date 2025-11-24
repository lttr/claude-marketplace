---
allowed-tools: Bash(find:*), Bash(echo:*), Bash(cd:*), Bash(pnpm install:*), Bash(mkdir:*), Bash(chmod:*), Bash(ln:*), Bash(grep:*)
---

Set up browser-tools plugin by installing dependencies and creating global symlinks.

## Execution steps:

**Step 1: Find the plugin scripts directory**

Locate the browser-tools scripts directory (search in ~/.claude/plugins for browser-tools plugin):

```bash
SCRIPTS_DIR=$(find ~/.claude/plugins -type d -path "*/browser-tools/skills/browser-tools/scripts" 2>/dev/null | head -1)
```

Verify it was found:

```bash
echo "Found scripts at: $SCRIPTS_DIR"
```

**Step 2: Install dependencies**

```bash
cd "$SCRIPTS_DIR" && pnpm install
```

**Step 3: Create ~/.bin directory**

```bash
mkdir -p ~/.bin
```

**Step 4: Make scripts executable**

```bash
chmod +x "$SCRIPTS_DIR"/browser-*.js
```

**Step 5: Create symlinks (WITHOUT .js extension)**

IMPORTANT: Symlink names should NOT have .js extension:

```bash
ln -sf "$SCRIPTS_DIR/browser-start.js" ~/.bin/browser-start
ln -sf "$SCRIPTS_DIR/browser-nav.js" ~/.bin/browser-nav
ln -sf "$SCRIPTS_DIR/browser-eval.js" ~/.bin/browser-eval
ln -sf "$SCRIPTS_DIR/browser-screenshot.js" ~/.bin/browser-screenshot
ln -sf "$SCRIPTS_DIR/browser-pick.js" ~/.bin/browser-pick
ln -sf "$SCRIPTS_DIR/browser-cookies.js" ~/.bin/browser-cookies
```

**Step 6: Verify PATH**

Check if ~/.bin is in PATH:

```bash
echo $PATH | grep -q "$HOME/.bin" && echo "✓ ~/.bin is in PATH" || echo "⚠ WARNING: Add ~/.bin to PATH in your shell profile"
```

## Summary

After completion, report:

- Dependencies installed: ✓
- Symlinks created: browser-start, browser-nav, browser-eval, browser-screenshot, browser-pick, browser-cookies
- PATH status: (OK or needs manual addition)
