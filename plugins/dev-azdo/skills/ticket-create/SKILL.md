---
name: ticket-create
description: Create an Azure DevOps work item (Technical task / User Story / Bug …) with a Markdown description, parent link, area/iteration, and tags — in a single `az rest` call. Trigger when the user says "create azdo ticket", "new work item", "create technical task", "child ticket under #N", or asks to spawn a follow-up ticket from code or plan context. Use INSTEAD OF `az boards work-item create` whenever the description should render as Markdown (that command cannot pass the format flag).
allowed-tools: Bash(az *), Bash(cat *), Bash(trash-put *), Read, Write, Edit
argument-hint: <title> [--type "Technical task"] [--parent <id>] [--tags a,b] [--description-file <path>]
---

# Create AzDO Work Item (Markdown-aware)

`az boards work-item create` stores `--description` as **HTML** with no flag to override. To get a Markdown-rendered description, create the item via `az rest` POST with a JSON-Patch body that includes `/multilineFieldsFormat/System.Description = "Markdown"` alongside the field op. The format cannot be flipped reliably after creation — to convert an existing HTML item, delete and recreate.

## Step 1 — Resolve org and project (always first)

Shell variables do **not** survive between Bash calls, so resolve these once, read the printed
values, and paste the literals into every later command. Never carry `$BASE` across calls.

```bash
# cut -f2- + sed, not `tr -d ' '` — AzDO project names may contain spaces.
TRIM="s/^ *//; s/ *$//"
ORG_URL="${AZDO_ORG_URL:-$(az devops configure --list | grep '^organization' | cut -d= -f2- | sed "$TRIM")}"
PROJECT="${AZDO_PROJECT:-$(az devops configure --list | grep '^project' | cut -d= -f2- | sed "$TRIM")}"
: "${ORG_URL:?no organization — set AZDO_ORG_URL or run az devops configure --defaults}"
: "${PROJECT:?no project — set AZDO_PROJECT or run az devops configure --defaults}"
echo "ORG_URL=$ORG_URL"
echo "BASE=$ORG_URL/$PROJECT/_apis/wit"
```

**If this command aborts with either `:?` message, stop and ask the user for their AzDO
organization URL and project.** They are team-specific — never guess them, never fall back to
an org name seen elsewhere in the repo or conversation. How the user persists the values (env
var, `az devops configure --defaults`) is their call.

The two constants below are fixed and can be typed literally — they need no resolution step:

| Constant    | Value                                  | Why                                                                                                         |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| resource id | `499b84ac-1321-427f-aa17-267ca6975798` | AzDO's fixed Azure AD app id, same for every org. Without `--resource`, `az` mints an ARM token → TF400813. |
| api version | `7.1`                                  |                                                                                                             |

## Step 2 — Work item types

Types come from the project's process template. List them before creating if unsure. Substitute
the real `BASE` printed by step 1 — the placeholder is not a shell variable.

```bash
az rest --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --uri "<BASE>/workitemtypes?api-version=7.1" \
  --query "value[].name" -o tsv
```

Casing matters and is often surprising (e.g. `Technical task` with a lowercase `t`). URL-encode spaces as `%20` after the leading `$`: `…/workitems/$Technical%20task`.

## Step 3 — Create call (template)

Substitute the real `BASE` and `ORG_URL` printed by step 1 — the placeholders are not shell
variables. Note the `\$` before the type name: that dollar sign is part of the AzDO URL syntax
and must survive shell quoting.

```bash
cat > /tmp/wi-create.json <<'EOF'
[
  {"op":"add","path":"/fields/System.Title","value":"<TITLE>"},
  {"op":"add","path":"/fields/System.AreaPath","value":"<AREA>"},
  {"op":"add","path":"/fields/System.IterationPath","value":"<ITERATION>"},
  {"op":"add","path":"/fields/System.Tags","value":"<TAGS>"},
  {"op":"add","path":"/fields/System.Description","value":"<MARKDOWN BODY — \\n for newlines, real backticks/asterisks OK>"},
  {"op":"add","path":"/multilineFieldsFormat/System.Description","value":"Markdown"},
  {"op":"add","path":"/relations/-","value":{"rel":"System.LinkTypes.Hierarchy-Reverse","url":"<ORG_URL>/_apis/wit/workItems/<PARENT_ID>"}}
]
EOF

az rest --method POST --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --url "<BASE>/workitems/\$Technical%20task?api-version=7.1" \
  --headers "Content-Type=application/json-patch+json" \
  --body @/tmp/wi-create.json \
  --query "{id:id, type:fields.\"System.WorkItemType\", descFormat:multilineFieldsFormat, tags:fields.\"System.Tags\", parent:relations[?attributes.name=='Parent'].url|[0]}" -o json

trash-put /tmp/wi-create.json
```

Drop the ops you don't need — area/iteration default to the project root, tags and the parent relation are optional.

Verify the response shows `"descFormat": {"System.Description": "markdown"}` (lowercase). If it shows `"html"`, the format op was missed — see below.

## Update an existing item's description (Markdown-preserving)

```bash
cat > /tmp/wi-patch.json <<'EOF'
[
  {"op":"add","path":"/fields/System.Description","value":"<MARKDOWN BODY>"},
  {"op":"add","path":"/multilineFieldsFormat/System.Description","value":"Markdown"}
]
EOF

az rest --method PATCH --resource 499b84ac-1321-427f-aa17-267ca6975798 \
  --uri "<ORG_URL>/_apis/wit/workitems/<ID>?api-version=7.1" \
  --headers "Content-Type=application/json-patch+json" \
  --body @/tmp/wi-patch.json \
  --query "{descFormat:multilineFieldsFormat, desc:fields.\"System.Description\"}" -o json

trash-put /tmp/wi-patch.json
```

Caveat: if the item was originally created as HTML, this PATCH may keep `descFormat: html` even though the Markdown characters survive in storage. The reliable fix is delete + recreate via the POST above.

## Add a parent link to an existing item (without recreating)

```bash
az boards work-item relation add \
  --id <CHILD_ID> --relation-type parent --target-id <PARENT_ID> \
  --query "{id:id, parent:relations[?attributes.name=='Parent'].url|[0]}" -o json
```

## Soft-delete (recoverable from recycle bin)

```bash
az boards work-item delete --id <ID> --yes
```

`--destroy` removes permanently — do not pass it without explicit user confirmation.

## Description-writing rules

Defaults, applied unless the user or the project says otherwise:

- **Do not** repeat the parent ticket id inside the description body. The parent relation link is enough.
- **Avoid** scaffolding phrases like "Why deferred:", "Why it works:", "Background:", "Context:". State the facts directly instead.
- Keep it descriptive, not directive — let the future implementer choose the shape. Don't enumerate "Changes:" / "Steps:" bullet lists unless the user explicitly asks.
- Aim short — half the length of an LLM's first instinct is usually right.

## Troubleshooting

| Symptom                                     | Cause                                                                | Fix                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| URL contains `//_apis` or an empty segment  | `$BASE` carried over from an earlier Bash call and expanded to empty | Re-run step 1, paste the literal value                                |
| `TF400813: not authorized`, empty user GUID | token had no AzDO scope                                              | pass `--resource 499b84ac-…`; if it persists, `az logout && az login` |
| `descFormat` comes back `html`              | the `/multilineFieldsFormat/System.Description` op was missing       | delete and recreate — see the caveat above                            |
| type not found                              | wrong casing or unencoded space                                      | re-list types (step 2), encode spaces as `%20`                        |

## Related skills

- `dev-azdo:ticket` — transition a work item between states (active / cr / ready / closed). Use after creating.
- `dev-azdo:ticket-comments` — post a Markdown comment on the discussion thread.
- `dev-azdo:feature-branch` — start a feature branch from an existing ticket id.
- `dev-azdo:pr` — create / checkout / list / complete pull requests linked to a ticket.

## Self-test after creating

1. Response JSON shows expected `id`, `type`, `tags`, `parent`, `descFormat: markdown`.
2. Open `<ORG_URL>/<PROJECT>/_workitems/edit/<id>` in a browser if visual confirmation is needed.
3. If embedding the new id into a plan or TODO, update those references in the same turn.
