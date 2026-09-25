# pr complete

Merge the Azure DevOps PR for the current branch and delete the source branch.

## Workflow

1. **Find the PR for the current branch.** `git branch --show-current` gives the branch, then:

   ```bash
   az repos pr list --source-branch <BRANCH> --status active --query "[0].{id:pullRequestId, title:title, target:targetRefName}" -o json
   ```

   No PR: stop and report. Print the id and paste it as a literal below.

2. **Linked work items:**

   ```bash
   az repos pr work-item list --id <PR_ID> --query "[].id" -o tsv
   ```

3. **Approval gate.** Merging is irreversible in practice and deletes the source branch. Show
   and wait for an explicit go-ahead:

   ```
   PR:            !<PR_ID>, <title>
   Merge into:    <target, without refs/heads/>
   Source branch: <BRANCH> (deleted after merge)
   Work items:    #<ID>, … (state change offered after the merge)
   ```

4. **Complete.** `--transition-work-items false` keeps Azure DevOps from moving work items on
   its own. State changes go through `ticket` in the next step.

   ```bash
   az repos pr update --id <PR_ID> --status completed --delete-source-branch true --transition-work-items false --query "{status:status, mergeStatus:mergeStatus}" -o json
   ```

5. **Report** the completion status. A policy block (required reviewers, builds) comes back as
   an error. Report it as is.

6. **Offer the next state** for each linked work item. Invoke the `ticket` skill's `state` op
   without a target state and in a post-merge context. It looks up the states the item's type
   actually has, proposes the next one or lists the options, and asks. Never transition without
   asking.

## Notes

- Merge strategy follows the repo policy.
