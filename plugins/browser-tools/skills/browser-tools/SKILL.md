---
name: browser-tools
description: Use this skill when the user asks to test, verify, interact with, or automate web pages and browsers. Trigger for requests involving Chrome automation, browser testing, web scraping, screenshot capture, element selection, or checking web applications. Also trigger when user mentions "browser tools" explicitly.
allowed-tools: Bash(node scripts/browser-start.js:*), Bash(node scripts/browser-nav.js:*), Bash(node scripts/browser-eval.js:*), Bash(node scripts/browser-screenshot.js:*), Bash(node scripts/browser-pick.js:*), Bash(node scripts/browser-cookies.js:*), Bash(cd *:*), Bash(pnpm install:*), Read, Glob
---

# Browser Tools

Chrome DevTools Protocol automation for agent-assisted web testing and interaction. Uses Chrome running on `:9222` with remote debugging.

## Usage

When user asks to test, verify, or interact with web pages using browser tools:

1. **Check dependencies** - Ensure scripts/node_modules exists
2. **Install if needed** - Run `cd plugins/browser-tools/skills/browser-tools/scripts && pnpm install` if missing
3. **Start Chrome** - Launch with debugging enabled
4. **Navigate & interact** - Use scripts to navigate, evaluate JS, take screenshots
5. **Return results** - Show output/screenshots to user

## Available Scripts

All scripts located in `skills/browser-tools/scripts/`:

### browser-start.js

```bash
node scripts/browser-start.js              # Fresh profile
node scripts/browser-start.js --profile    # Persistent profile at /tmp/chrome-profile-browser-tools
```

Launch Chrome with remote debugging on port 9222. Use `--profile` to maintain login state between sessions.

### browser-nav.js

```bash
node scripts/browser-nav.js https://example.com
node scripts/browser-nav.js https://example.com --new
```

Navigate to URLs. Use `--new` to open in new tab instead of current tab.

### browser-eval.js

```bash
node scripts/browser-eval.js 'document.title'
node scripts/browser-eval.js 'document.querySelectorAll("a").length'
node scripts/browser-eval.js 'Array.from(document.querySelectorAll("h1")).map(h => h.textContent)'
```

Execute JavaScript in active tab. Runs in async context. Use for:

- Extract data from pages
- Inspect page state
- Manipulate DOM
- Test page functionality

### browser-screenshot.js

```bash
node scripts/browser-screenshot.js
```

Capture current viewport, returns temp file path. Use Read tool to show screenshot to user.

### browser-pick.js

```bash
node scripts/browser-pick.js                      # Uses default message "Select element(s)"
node scripts/browser-pick.js "Select the submit button"
```

**Interactive element picker** - Launches UI overlay for user to click and select elements. Returns element details (tag, id, class, text, html, parent hierarchy). Message parameter is optional.

Use when:

- User says "click that button" or "extract those items"
- Need specific selectors but page structure is unclear
- User wants to identify elements visually

Controls:

- Click to select single element
- Cmd/Ctrl+Click for multiple selections
- Enter to finish (when multiple selected)
- ESC to cancel

### browser-cookies.js

```bash
node scripts/browser-cookies.js
```

Display all cookies for current tab (domain, path, httpOnly, secure flags). Use for debugging auth issues.

## Workflow Examples

### Test dev server feature

```bash
# From plugin skill directory
cd plugins/browser-tools/skills/browser-tools

# Ensure deps installed
if [ ! -d "scripts/node_modules" ]; then
  cd scripts && pnpm install && cd ..
fi

# Start browser with persistent profile
node scripts/browser-start.js --profile

# Navigate to dev server
node scripts/browser-nav.js http://localhost:3000

# Test functionality
node scripts/browser-eval.js 'document.querySelector("#new-feature").textContent'

# Take screenshot
SCREENSHOT=$(node scripts/browser-screenshot.js)
# Then use Read tool to show screenshot at $SCREENSHOT path
```

### Debug authentication

```bash
node scripts/browser-start.js --profile
node scripts/browser-nav.js https://app.example.com/login
node scripts/browser-cookies.js
```

### Extract data from page

```bash
node scripts/browser-start.js
node scripts/browser-nav.js https://example.com
node scripts/browser-eval.js 'Array.from(document.querySelectorAll(".product")).map(p => ({name: p.querySelector(".title").textContent, price: p.querySelector(".price").textContent}))'
```

## Important Notes

- **Chrome must be installed** - Scripts use `google-chrome` binary
- **Port 9222** - Chrome runs with `--remote-debugging-port=9222`
- **Profile location** - `/tmp/chrome-profile-browser-tools` when using `--profile`
- **Temp screenshots** - Screenshots saved to OS temp directory
- **Dependencies** - Requires `puppeteer-core` (auto-installed via pnpm)
- **Error handling** - If scripts fail, check Chrome is running and port 9222 is available

## Dependency Installation

First time using this skill or if scripts fail:

```bash
cd plugins/browser-tools/skills/browser-tools/scripts
pnpm install
```

If pnpm install fails, user must install manually or check Node.js/pnpm setup.
