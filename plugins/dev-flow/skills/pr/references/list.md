# pr list

List active Azure DevOps PRs.

## Input

`$ARGUMENTS` after `list`:

| Form           | Scope                                     |
| -------------- | ----------------------------------------- |
| empty / `mine` | PRs created by me OR where I'm a reviewer |
| `all`          | all active PRs in repo                    |

## Pre-req

User email + project name come from local git/az config. Detect:

```bash
me=$(az account show --query user.name -o tsv)
repo=$(git remote get-url origin | sed 's|.*/_git/||')
```

## Workflow

### `all`

```bash
az repos pr list --status active --repository "$repo" --output table
```

### `mine` / empty

Run two queries, combine:

```bash
az repos pr list --status active --repository "$repo" --creator "$me"  --output json
az repos pr list --status active --repository "$repo" --reviewer "$me" --output json
```

For each PR I created, count unresolved threads:

```bash
project=$(az devops configure -l --query "[?name=='project'].value" -o tsv)
az devops invoke --area git --resource pullRequestThreads \
  --route-parameters project="$project" repositoryId="$repo" pullRequestId=<id> \
  --query 'value[?status==`active`] | length(@)' -o tsv
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
