---
name: ticket-comments
description: Add, update, or delete a comment on an Azure DevOps work item (the Discussion thread) via the dedicated Comments REST API, with Markdown rendering. Trigger when the user says "comment on ticket #N", "add a comment to the work item", "update/edit the AzDO comment", "delete a work-item comment", or asks to post discussion notes on a ticket. Use INSTEAD OF patching `System.History` whenever the comment should render as Markdown or may need to be edited or deleted later.
allowed-tools: Bash(az *), Bash(cat *), Bash(trash-put *), Read, Write, Edit
argument-hint: <work-item-id> [--text "..."] [--text-file <path>] [--update <commentId>] [--delete <commentId>]
---

# Comment on an AzDO Work Item (Markdown-aware)

There are two ways to put text on a work item's discussion. Use the **Comments API**, not the `System.History` patch.

| Method                                       | Editable? | Deletable? | Markdown?                              |
| -------------------------------------------- | --------- | ---------- | -------------------------------------- |
| `PATCH workitems/{id}` with `System.History` | no        | no         | no (HTML-coerced)                      |
| Comments API `workItems/{id}/comments`       | yes       | yes        | yes, via `format=markdown` query param |

The `format` flag lives in the **query string**, not the body. Omit it and the text is stored as HTML, so Markdown shows up literally.

This is work-item discussion only. For pull-request thread comments, use `dev-azdo:pr-comments`.

## Step 1: Resolve org and project (always first)

Shell variables do **not** survive between Bash calls, so resolve these once, read the printed
values, and paste the literals into every later command. Never carry `$BASE` across calls.

```bash
# cut -f2- + sed, not `tr -d ' '`. AzDO project names may contain spaces.
TRIM="s/^ *//; s/ *$//"
ORG_URL="${AZDO_ORG_URL:-$(az devops configure --list | grep '^organization' | cut -d= -f2- | sed "$TRIM")}"
PROJECT="${AZDO_PROJECT:-$(az devops configure --list | grep '^project' | cut -d= -f2- | sed "$TRIM")}"
: "${ORG_URL:?no organization, set AZDO_ORG_URL or run az devops configure --defaults}"
: "${PROJECT:?no project, set AZDO_PROJECT or run az devops configure --defaults}"
echo "BASE=$ORG_URL/$PROJECT/_apis/wit/workItems"
```

**If this command aborts with either `:?` message, stop and ask the user for their AzDO
organization URL and project.** They are team-specific. Never guess them, never fall back to
an org name seen elsewhere in the repo or conversation. How the user persists the values (env
var, `az devops configure --defaults`) is their call.

The two constants below are fixed and can be typed literally. They need no resolution step:

| Constant    | Value                                  | Why                                                                                                                               |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| resource id | `499b84ac-1321-427f-aa17-267ca6975798` | AzDO's fixed Azure AD app id, same for every org. Without `--resource`, `az` mints an ARM token and the call fails with TF400813. |
| api version | `7.1-preview.4`                        | Comments API is preview-only. Plain `7.1` fails.                                                                                  |

## Step 2: Show the text and get approval (never skip)

A comment posts under the user's name and notifies the work item's followers. Editing or
deleting it afterwards does not un-send the notification, and everyone watching has already read
it. The text is also **your** prose. The user has not seen the words yet.

Before any POST or PATCH below, print the exact Markdown body verbatim, name the target
(`work item #N`, plus the comment id and its current text when updating), and wait for an
explicit go-ahead.

Rules:

- Print the body in full, not a summary of it. Summarizing defeats the review.
- "Comment on #N saying X" is a request to draft it, not standing approval to post. Ask anyway.
- Approval covers the text as shown. If the user amends it, show the corrected version again.
- Approval for one comment is not approval for the next.
- Skip only if the user has said, in this session, to post without review.

The operations below all sit behind this gate.

## Writing the comment

**No em-dashes.** Split the sentence in two. Same for semicolons.

**Every sentence earns its place.** Cut the ones the reader could skip without acting
differently, starting with scaffolding labels ("Update:", "TL;DR:"). No target length. Comments
arrive as notification emails with no thread context, so sentence one states the point and the
rest supports it.

## Create a comment

Substitute the real `BASE` printed by step 1. The placeholder below is not a shell variable.

```bash
cat > /tmp/wi-comment.json <<'EOF'
{"text":"<MARKDOWN BODY. Real backticks/asterisks OK. Use \\n for newlines>"}
EOF

az rest --method POST --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --uri "<BASE>/<ID>/comments?format=markdown&api-version=7.1-preview.4" \
  --headers "Content-Type=application/json" \
  --body @/tmp/wi-comment.json \
  --query "{id:id, format:renderedText && 'ok'}" -o json

trash-put /tmp/wi-comment.json
```

## Update an existing comment

This **replaces** the body outright. Fetch the current text (see the list call below) and show
the user both versions before patching. Otherwise wording they wrote is silently discarded.

```bash
cat > /tmp/wi-comment.json <<'EOF'
{"text":"<NEW MARKDOWN BODY>"}
EOF

az rest --method PATCH --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --uri "<BASE>/<ID>/comments/<COMMENT_ID>?format=markdown&api-version=7.1-preview.4" \
  --headers "Content-Type=application/json" \
  --body @/tmp/wi-comment.json -o json

trash-put /tmp/wi-comment.json
```

## Delete a comment

Unlike work items, there is **no recycle bin for comments**. This is unrecoverable. List first,
show the user the author and full text of the comment about to go, and confirm. Never delete a
comment written by someone else without the user saying so explicitly, having seen whose it is.

```bash
az rest --method DELETE --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --uri "<BASE>/<ID>/comments/<COMMENT_ID>?api-version=7.1-preview.4"
```

## List comments (to find a COMMENT_ID)

```bash
az rest --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --uri "<BASE>/<ID>/comments?api-version=7.1-preview.4" \
  --query "comments[].{id:id, by:createdBy.displayName, text:text}" -o json
```

## Troubleshooting

| Symptom                                     | Cause                                                                | Fix                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| URL contains `//_apis` or an empty segment  | `$BASE` carried over from an earlier Bash call and expanded to empty | Re-run step 1, paste the literal value                                |
| `TF400813: not authorized`, empty user GUID | token had no AzDO scope                                              | pass `--resource 499b84ac-…`. If it persists, `az logout && az login` |
| Markdown renders literally                  | `format=markdown` missing from the **query string**                  | it does not work in the body                                          |

## Note on work-item _description_ fields

`System.Description` and repro-steps are separate HTML fields with their own `multilineFieldsFormat` flag. They are NOT the Comments API. To create or edit a Markdown description, see `dev-azdo:ticket-create` (JSON-Patch with `/multilineFieldsFormat/System.Description`).
