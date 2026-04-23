# pr create

Push current branch and open an Azure DevOps PR.

## Pre-flight

```bash
cur=$(git branch --show-current)
[ "$cur" = "main" ] || [ "$cur" = "master" ] && abort "On base branch. Run /dev-flow:branch <ticket> first."

base=$(git rev-parse --verify master 2>/dev/null && echo master || echo main)
ahead=$(git rev-list --count "$base"..HEAD)
[ "$ahead" -eq 0 ] && abort "No commits ahead of $base. Commit your changes first."
```

No inline commit fallback — by design. The user controls commit shape.

## Workflow

1. **Push (set upstream):**
   ```bash
   git push -u origin "$cur"
   ```
2. **Derive title/description:**
   - Title from latest commit subject, or from `$ARGUMENTS` after `create ` if user passed text
   - Description: 1-3 bullet summary of commits ahead of base (`git log --oneline "$base"..HEAD`)
3. **Extract ticket id** from branch name `feature/<id>-...` if present
4. **Create PR:**
   ```bash
   az repos pr create \
     --source-branch "$cur" \
     --target-branch "$base" \
     --title "<title>" \
     --description "<desc>" \
     --work-items <id>   # only if extracted
   ```
5. **Report:** Print PR URL.
