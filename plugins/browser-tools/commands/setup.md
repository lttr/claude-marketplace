Set up browser-tools plugin by installing dependencies and creating global symlinks for all browser scripts.

This command:

1. Installs npm dependencies (chrome-remote-interface) in the scripts directory
2. Creates ~/.bin/ directory if it doesn't exist
3. Makes all browser scripts executable
4. Creates symlinks in ~/.bin/ for: browser-start, browser-nav, browser-eval, browser-screenshot, browser-pick, browser-cookies
5. Verifies ~/.bin is in your PATH

The setup is idempotent - safe to run multiple times. Existing symlinks will be reported but not changed unless they point to the wrong target.

Run this command once after installing the browser-tools plugin.
