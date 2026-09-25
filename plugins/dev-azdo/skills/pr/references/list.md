# pr list

List active Azure DevOps PRs.

## Input

From the request:

| Form          | Scope                                     |
| ------------- | ----------------------------------------- |
| empty or mine | PRs created by me OR where I'm a reviewer |
| all           | all active PRs in the repo                |

## Resolve

Run once, print the values, paste the literals into the commands below:

- Me: `az account show --query user.name -o tsv`
- Org, project, repo: see the conventions (`${CLAUDE_PLUGIN_ROOT}/references/conventions.md`).
  The repo is the last segment of the remote URL. The project is only needed for the thread
  count.

## Workflow

### all

```bash
az repos pr list --status active --repository <REPO> --output table
```

### mine / empty

Run two queries and combine them:

```bash
az repos pr list --status active --repository <REPO> --creator <ME> --query "[].{id:pullRequestId, title:title}" -o json
az repos pr list --status active --repository <REPO> --reviewer <ME> --query "[].{id:pullRequestId, title:title, creator:createdBy.displayName}" -o json
```

For each PR I created, count unresolved threads:

```bash
az devops invoke --org <ORG_URL> --area git --resource pullRequestThreads --route-parameters project=<PROJECT> repositoryId=<REPO> pullRequestId=<PR_ID> --api-version 7.1 --query "length(value[?status=='active' || status=='pending'])" -o tsv
```

## Output

```
**Created by me:**
| ID  | Title       | Unresolved   |
|-----|-------------|--------------|
| 123 | feat: ...   | 2 comments   |

**Reviewing:**
| ID  | Title       | Creator      |
|-----|-------------|--------------|
```
