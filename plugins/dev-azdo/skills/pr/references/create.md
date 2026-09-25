# pr create

Push the current branch and open an Azure DevOps PR.

## Pre-flight

1. `git branch --show-current` gives the source branch.
2. Resolve the default branch (conventions, "Default branch"). If the source branch is the
   default branch, stop: "On the default branch. Run /dev-azdo:feature-branch <ticket> first."
3. `git rev-list --count origin/<BASE>..HEAD`. If it prints `0`, stop: "No commits ahead of
   <BASE>. Commit your changes first."

No inline commit fallback, by design. The user controls commit shape.

## Workflow

1. **Draft title and description.**
   - Title from the latest commit subject, or from the user's text if given.
   - Description from the commits ahead of base (`git log --oneline origin/<BASE>..HEAD`),
     following the writing guideline in the conventions.
2. **Extract the ticket id** from a branch named `feature/<id>-…`, if present. Fetch its title
   so a wrong id is visible:
   ```bash
   az boards work-item show --id <ID> --query 'fields."System.Title"' -o tsv
   ```
3. **Approval gate.** Show and wait for an explicit go-ahead:
   ```
   Source:      <BRANCH>
   Target:      <BASE>
   Work item:   #<ID>, <ticket title>   (or: none)
   Title:       <TITLE>

   Description:
   <THE FULL DESCRIPTION, verbatim>
   ```
4. **Push** (sets upstream):
   ```bash
   git push -u origin <BRANCH>
   ```
5. **Create the PR.** `--description` takes each value as one line, so pass the description's
   lines as separate quoted values. Drop `--work-items` when there is no ticket.
   ```bash
   az repos pr create --source-branch <BRANCH> --target-branch <BASE> --title "<TITLE>" --description "<LINE 1>" "<LINE 2>" --work-items <ID> --query "{id:pullRequestId, url:repository.webUrl}" -o json
   ```
6. **Report** the PR URL: `<url>/pullrequest/<id>`.
7. **Offer the ticket transition** when a work item is linked: "Move #<ID> to Code Review?"
   On yes, invoke the `ticket` skill with `state <ID> cr`. Never transition without asking.
