# Browser Tools Plugin

Chrome DevTools Protocol automation for Claude Code. Enables agent-assisted web testing, verification, and interaction without heavyweight MCP servers.

## Features

- **Lightweight**: 6 focused scripts vs 21+ MCP tools
- **Composable**: Chain commands, save outputs, process results
- **Profile support**: Maintain login state across sessions
- **Interactive picking**: Visual element selection interface
- **Screenshot capture**: Visual verification of pages

## Installation

```bash
/plugin marketplace add lukastrumm/claude-marketplace
/plugin install browser-tools@claude-marketplace
```

### Setup

**Run setup once after installation:**

```bash
/browser-tools:setup
```

This command:

- Installs npm dependencies (chrome-remote-interface)
- Creates `~/.bin/` directory if needed
- Makes all scripts executable
- Creates global symlinks for easy invocation
- Verifies `~/.bin` is in your PATH

The setup is idempotent and safe to rerun.

### Local Testing

```bash
/plugin marketplace add /path/to/claude-marketplace
/plugin install browser-tools@claude-marketplace
/browser-tools:setup
```

## Requirements

- **Node.js** - For running scripts
- **pnpm** - Package manager for dependency installation
- **Google Chrome** - Must have `google-chrome` binary available
- **~/.bin in PATH** - For global script access (setup command will verify)

## Usage

The `browser-tools` skill drives all functionality. Simply ask Claude to test or interact with web pages:

```
"Start the browser and navigate to localhost:3000"
"Check the dev server for the feature I just implemented"
"Take a screenshot of the login page"
"Extract all product names from the page"
```

### Example Workflows

**Test a feature:**

```
User: "Check if the new search feature works on localhost:3000"
Claude: *Starts browser, navigates, tests search input, takes screenshot, reports results*
```

**Debug authentication:**

```
User: "Why am I not staying logged in?"
Claude: *Checks cookies, inspects session state, diagnoses issue*
```

**Extract data:**

```
User: "Get all the article titles from hackernews"
Claude: *Navigates, evaluates JS to extract titles, returns list*
```

## Available Scripts

All scripts in `skills/browser-tools/scripts/`:

- **browser-start.js** - Launch Chrome with debugging
- **browser-nav.js** - Navigate to URLs
- **browser-eval.js** - Execute JavaScript in page
- **browser-screenshot.js** - Capture viewport
- **browser-pick.js** - Interactive element picker
- **browser-cookies.js** - Display cookies

See [SKILL.md](skills/browser-tools/SKILL.md) for detailed documentation.

## Configuration

### Profile Location

Persistent profile stored at: `/tmp/chrome-profile-browser-tools`

### Chrome Port

Debugging runs on: `http://localhost:9222`

### Screenshot Location

Temp directory (OS-specific)

## Troubleshooting

**Scripts not found or fail to run:**

```bash
/browser-tools:setup
```

Run the setup command to install dependencies and create symlinks.

**Chrome won't start:**

- Ensure `google-chrome` is in PATH
- Check if port 9222 is already in use
- Try killing existing Chrome processes

**Scripts work but give "command not found":**

- Verify `~/.bin` is in your PATH
- Setup command will warn if PATH is missing `~/.bin`
- Add to PATH: `export PATH="$HOME/.bin:$PATH"` in your shell profile

## Philosophy

Based on [Mario Zechner's browser-tools](https://github.com/badlogic/browser-tools) and the principle that "agents don't need MCP for browser automation" ([read more](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)).

Key advantages:

- **Minimal context** - Scripts use ~1k tokens vs 13-18k for MCP
- **Full composability** - Bash and code are naturally chainable
- **Easy extension** - Add new scripts without server rebuilds
- **Lower overhead** - Direct script execution vs protocol translation

## License

Scripts adapted from [badlogic/browser-tools](https://github.com/badlogic/browser-tools) (MIT License).

## Credits

- Original scripts by [Mario Zechner](https://github.com/badlogic)
- Plugin packaging by Lukas Trumm & Claude AI
