# Create AzDO Work Item (Markdown-aware)

`az boards work-item create` stores `--description` as **HTML** with no flag to override. To get a Markdown-rendered description, create the item via `az rest` POST with a JSON-Patch body that includes `/multilineFieldsFormat/System.Description = "Markdown"` alongside the field op. The format cannot be flipped reliably after creation. To convert an existing HTML item, delete and recreate.

Shared rules live in `${CLAUDE_PLUGIN_ROOT}/references/conventions.md`.

## Step 1: Resolve org and project (always first)

Resolve them as the conventions describe, print them, and use the literals `<ORG_URL>` and
`<BASE>` = `<ORG_URL>/<PROJECT>/_apis/wit` in every later command. Encode spaces in the project
as `%20`. If no source yields a value, stop and ask. Never guess.

The two constants below are fixed and can be typed literally. They need no resolution step:

| Constant    | Value                                  | Why                                                                                                                               |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| resource id | `499b84ac-1321-427f-aa17-267ca6975798` | AzDO's fixed Azure AD app id, same for every org. Without `--resource`, `az` mints an ARM token and the call fails with TF400813. |
| api version | `7.1`                                  |                                                                                                                                   |

## Step 2: Pick the work item type

Types come from the project's process template and differ between projects. List them:

```bash
az rest --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<BASE>/workitemtypes?api-version=7.1" --query "value[].name" -o tsv
```

Pick the type that matches the request (a bug, a task, a story). If the user named one, use the
listed spelling. When more than one fits or none does, list the types and ask.

Casing matters and is often surprising (e.g. `Technical task` with a lowercase `t`). In the
create URL the type follows a literal `$`, with spaces encoded as `%20`:
`…/workitems/$Technical%20task`.

## Step 3: Show the draft and get approval (never skip)

Creating a work item is outward-facing: it lands on a shared board, notifies watchers, and
appears in queries and reports. Soft-delete recovers the item but does not un-send any of that.
It goes through the approval gate in the conventions. Print the full draft and wait for an
explicit go-ahead before the POST in step 4:

```
Type:        <TYPE>
Title:       <TITLE>
Parent:      #<PARENT_ID>, <parent title, fetched so a wrong id is visible>
Area:        <AREA>
Iteration:   <ITERATION>
Tags:        <TAGS>

Description:
<THE FULL MARKDOWN BODY, verbatim, not a summary of it>
```

Fetch the parent's title rather than echoing the id back. A transposed id is invisible as a
number and obvious as a title. This costs one call:

```bash
az boards work-item show --id <PARENT_ID> --query 'fields."System.Title"' -o tsv
```

Filing several items means confirming each, or showing the whole set and getting one go-ahead
that explicitly covers all of them.

## Step 4: Create call (template)

Body file (see "Request bodies" in the conventions):

```json
[
  { "op": "add", "path": "/fields/System.Title", "value": "<TITLE>" },
  { "op": "add", "path": "/fields/System.AreaPath", "value": "<AREA>" },
  {
    "op": "add",
    "path": "/fields/System.IterationPath",
    "value": "<ITERATION>"
  },
  { "op": "add", "path": "/fields/System.Tags", "value": "<TAGS>" },
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "<MARKDOWN BODY. Use \\n for newlines. Real backticks/asterisks OK>"
  },
  {
    "op": "add",
    "path": "/multilineFieldsFormat/System.Description",
    "value": "Markdown"
  },
  {
    "op": "add",
    "path": "/relations/-",
    "value": {
      "rel": "System.LinkTypes.Hierarchy-Reverse",
      "url": "<ORG_URL>/_apis/wit/workItems/<PARENT_ID>"
    }
  }
]
```

Drop the ops you don't need. Area and iteration default to the project root. Tags and the parent relation are optional.

The `$` before the type is part of the Azure DevOps URL. Single-quote the URL so no shell
expands it:

```bash
az rest --method POST --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri '<BASE>/workitems/$<TYPE>?api-version=7.1' --headers "Content-Type=application/json-patch+json" --body @<PATH> --query '{id:id, type:fields."System.WorkItemType", descFormat:multilineFieldsFormat, tags:fields."System.Tags", parent:relations[?attributes.name==`"Parent"`].url|[0]}' -o json
```

Verify the response shows `"descFormat": {"System.Description": "markdown"}` (lowercase). If it shows `"html"`, the format op was missed. See below.

## Update an existing item's description (Markdown-preserving)

This **overwrites** the existing description. There is no merge and no undo. Read the current
value first, show the user what is being replaced and what replaces it, and get approval:

```bash
az boards work-item show --id <ID> --query 'fields."System.Description"' -o tsv
```

Body file:

```json
[
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "<MARKDOWN BODY>"
  },
  {
    "op": "add",
    "path": "/multilineFieldsFormat/System.Description",
    "value": "Markdown"
  }
]
```

```bash
az rest --method PATCH --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<ORG_URL>/_apis/wit/workitems/<ID>?api-version=7.1" --headers "Content-Type=application/json-patch+json" --body @<PATH> --query '{descFormat:multilineFieldsFormat, desc:fields."System.Description"}' -o json
```

Caveat: if the item was originally created as HTML, this PATCH may keep `descFormat: html` even though the Markdown characters survive in storage. The reliable fix is delete + recreate via the POST above.

## Add a parent link to an existing item (without recreating)

```bash
az boards work-item relation add --id <CHILD_ID> --relation-type parent --target-id <PARENT_ID> --query "{id:id, parent:relations[?attributes.name=='Parent'].url|[0]}" -o json
```

## Soft-delete (recoverable from recycle bin)

Confirm the id and title with the user first. `--yes` suppresses the CLI's own prompt, so this
runs unattended. Deleting the wrong item is silent until someone misses it.

```bash
az boards work-item delete --id <ID> --yes
```

`--destroy` removes permanently, bypassing the recycle bin. Never pass it unless the user asked
for permanent destruction in those terms.

## Writing the title and description

Title names a verifiable thing, not a region: `Checkout stalls on a zero-price item`, not
`Checkout`. No `[Bug]` prefix or id echo.

The description follows the writing guideline in the conventions.

## Troubleshooting

| Symptom                                     | Cause                                                          | Fix                                                                   |
| ------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| URL contains `//_apis` or an empty segment  | a value was carried as a shell variable and expanded to empty  | Re-run step 1, paste the literal value                                |
| `TF400813: not authorized`, empty user GUID | token had no AzDO scope                                        | pass `--resource 499b84ac-…`. If it persists, `az logout && az login` |
| `descFormat` comes back `html`              | the `/multilineFieldsFormat/System.Description` op was missing | delete and recreate, see the caveat above                             |
| type not found                              | wrong casing, unencoded space, or `$` expanded by the shell    | re-list types (step 2), encode spaces as `%20`, single-quote the URL  |

## Related operations

- `ticket state`: transition the new item. Use after creating.
- `ticket comment`: post a Markdown comment on the discussion thread.
- `dev-azdo:feature-branch`: start a feature branch from an existing ticket id.
- `dev-azdo:pr`: create / checkout / list / complete pull requests linked to a ticket, and post or assess PR comments.

## Self-test after creating

1. Response JSON shows expected `id`, `type`, `tags`, `parent`, `descFormat: markdown`.
2. Open `<ORG_URL>/<PROJECT>/_workitems/edit/<id>` in a browser if visual confirmation is needed.
3. If embedding the new id into a plan or TODO, update those references in the same turn.
