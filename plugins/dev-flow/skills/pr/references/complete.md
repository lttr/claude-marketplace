# pr complete

Merge the AZDO PR for the current branch and delete source.

## Input

`$ARGUMENTS` after `complete`:

- empty → don't transition work items
- `--transition-work-items` / `-t` → transition work items

## Workflow

1. **Find PR for current branch:**

   ```bash
   pr=$(az repos pr list --source-branch "$(git branch --show-current)" \
                          --status active --query "[0].pullRequestId" -o tsv)
   ```

   No PR → abort, report.

2. **Complete:**

   ```bash
   az repos pr update --id "$pr" \
     --status completed \
     --delete-source-branch true \
     --transition-work-items <true|false>
   ```

3. **Report:** completion status.

## Notes

- Merge strategy follows AZDO repo policy.
- Source branch always deleted.
- Work-item transition is opt-in (use flag).
