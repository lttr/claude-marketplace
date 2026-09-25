# Comment on an AzDO Work Item (Markdown-aware)

There are two ways to put text on a work item's discussion. Use the **Comments API**, not the `System.History` patch.

| Method                                       | Editable? | Deletable? | Markdown?                              |
| -------------------------------------------- | --------- | ---------- | -------------------------------------- |
| `PATCH workitems/{id}` with `System.History` | no        | no         | no (HTML-coerced)                      |
| Comments API `workItems/{id}/comments`       | yes       | yes        | yes, via `format=markdown` query param |

The `format` flag lives in the **query string**, not the body. Omit it and the text is stored as HTML, so Markdown shows up literally.

This is work-item discussion only. For pull-request thread comments, use `dev-azdo:pr` (`comments` op).

Shared rules live in `${CLAUDE_PLUGIN_ROOT}/references/conventions.md`.

## Step 1: Resolve org and project (always first)

Resolve them as the conventions describe, print them, and use the literal
`<BASE>` = `<ORG_URL>/<PROJECT>/_apis/wit/workItems` in every later command. If no source yields
a value, stop and ask. Never guess.

The two constants below are fixed and can be typed literally. They need no resolution step:

| Constant    | Value                                  | Why                                                                                                                               |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| resource id | `499b84ac-1321-427f-aa17-267ca6975798` | AzDO's fixed Azure AD app id, same for every org. Without `--resource`, `az` mints an ARM token and the call fails with TF400813. |
| api version | `7.1-preview.4`                        | Comments API is preview-only. Plain `7.1` fails.                                                                                  |

## Step 2: Show the text and get approval (never skip)

A comment posts under the user's name and notifies the work item's followers. Every create,
update and delete below goes through the approval gate in the conventions. Show:

- the target: `work item #N`, plus the comment id and its current text when updating or deleting
- the exact Markdown body, verbatim

The text follows the writing guideline in the conventions.

## Create a comment

Body file (see "Request bodies" in the conventions):

```json
{ "text": "<MARKDOWN BODY. Real backticks/asterisks OK. Use \\n for newlines>" }
```

```bash
az rest --method POST --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<BASE>/<ID>/comments?format=markdown&api-version=7.1-preview.4" --headers "Content-Type=application/json" --body @<PATH> --query "{id:id, format:renderedText && 'ok'}" -o json
```

## Update an existing comment

This **replaces** the body outright. Fetch the current text (see the list call below) and show
the user both versions before patching. Otherwise wording they wrote is silently discarded.

Body file: `{"text": "<NEW MARKDOWN BODY>"}`

```bash
az rest --method PATCH --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<BASE>/<ID>/comments/<COMMENT_ID>?format=markdown&api-version=7.1-preview.4" --headers "Content-Type=application/json" --body @<PATH> -o json
```

## Delete a comment

Unlike work items, there is **no recycle bin for comments**. This is unrecoverable. List first,
show the user the author and full text of the comment about to go, and confirm. Never delete a
comment written by someone else without the user saying so explicitly, having seen whose it is.

```bash
az rest --method DELETE --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<BASE>/<ID>/comments/<COMMENT_ID>?api-version=7.1-preview.4"
```

## List comments (to find a COMMENT_ID)

```bash
az rest --resource 499b84ac-1321-427f-aa17-267ca6975798 --uri "<BASE>/<ID>/comments?api-version=7.1-preview.4" --query "comments[].{id:id, by:createdBy.displayName, text:text}" -o json
```

## Troubleshooting

| Symptom                                     | Cause                                                         | Fix                                                                   |
| ------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| URL contains `//_apis` or an empty segment  | a value was carried as a shell variable and expanded to empty | Re-run step 1, paste the literal value                                |
| `TF400813: not authorized`, empty user GUID | token had no AzDO scope                                       | pass `--resource 499b84ac-…`. If it persists, `az logout && az login` |
| Markdown renders literally                  | `format=markdown` missing from the **query string**           | it does not work in the body                                          |

## Note on work-item _description_ fields

`System.Description` and repro-steps are separate HTML fields with their own `multilineFieldsFormat` flag. They are NOT the Comments API. To create or edit a Markdown description, use `ticket create` (JSON-Patch with `/multilineFieldsFormat/System.Description`).
