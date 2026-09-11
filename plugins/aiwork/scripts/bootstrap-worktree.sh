#!/usr/bin/env bash
# Set up a manually created worktree: copy the gitignored files that
# `.worktreeinclude` (gitignore syntax) matches in the source checkout, then
# run the project's session-bootstrap hook. Fails when a copy fails.
#   bootstrap-worktree.sh <source-checkout> <worktree>
set -euo pipefail
src=$(realpath "$1") dst=$(realpath "$2")
cd "$src"

if [ -f .worktreeinclude ]; then
  # untracked files matching the include patterns, narrowed to the gitignored ones
  git ls-files -z --others --ignored --exclude-from=.worktreeinclude |
    { git check-ignore -z --stdin --no-index || [ $? -eq 1 ]; } |
    while IFS= read -r -d '' rel; do cp -a --parents "$rel" "$dst"; done
fi

hook=$dst/.claude/hooks/session-bootstrap.sh
[ -f "$hook" ] && (cd "$dst" && CLAUDE_PROJECT_DIR=$dst bash "$hook")
echo "worktree ready: $dst"
