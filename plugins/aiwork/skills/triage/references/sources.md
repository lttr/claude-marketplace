# Triage Sources

Pluggable inputs and outputs for `aiwork:triage`. Nothing here is required — every path degrades to "ask the user to paste the text" or "save to /tmp".

## Ticket fetch

Pick the first path that actually exists in the environment. Detect, don't assume.

| Tracker           | Detect                                                                  | Fetch                                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Azure DevOps**  | `az` on PATH + `azure-devops` extension; URL has `_workitems/edit/<id>` | `az boards work-item show --id <id> --expand all -o json`. The `az-cli` skill (ships with the `dev-azdo` plugin) has the full reference — invoke it if installed; otherwise use the command as written. |
| **GitHub**        | `gh` on PATH; URL has `github.com/<org>/<repo>/issues/<n>`              | `gh issue view <id> --json title,body,state,labels,assignees,comments`                                                                                                                                  |
| **Jira**          | Atlassian MCP tools connected; key like `PROJ-42`                       | Jira MCP issue-get tool                                                                                                                                                                                 |
| **Linear**        | Linear MCP tools connected; id like `ENG-42`                            | Linear MCP issue tool                                                                                                                                                                                   |
| **Generic MCP**   | Any connected issue-tracker MCP server                                  | Its own read tool                                                                                                                                                                                       |
| **Nothing found** | —                                                                       | Ask the user to paste the ticket text                                                                                                                                                                   |

Rules:

- Never guess a CLI invocation or an API endpoint. If the tool isn't on PATH or the MCP server isn't connected, ask.
- Bare numeric ids are ambiguous across trackers — if more than one tracker is available, ask which.
- Read-only. Triage never writes back to the tracker.

Normalize the response to: title, description, acceptance criteria, state, type, assignee, area / labels, linked items.

## Docs search

Optional enrichment in step 2. Use whatever is connected:

| Source         | Detect                   | Use                                                       |
| -------------- | ------------------------ | --------------------------------------------------------- |
| **Confluence** | Atlassian MCP tools      | Search by title keywords, area/feature name, domain terms |
| **Notion**     | Notion MCP tools         | Same query set                                            |
| **Web**        | `WebSearch` / `WebFetch` | Only for public/vendor docs the requirement depends on    |
| **Local**      | always                   | `docs/`, `wiki/`, ADRs, OpenAPI specs, `ARCHITECTURE.md`  |

Nothing connected → local docs only. Don't report an external search that didn't happen.

The Atlassian MCP server (Confluence, Jira) is not bundled with `aiwork`. It arrives with the `dev-azdo` plugin's `.mcp.json`, or from the user's own `~/.claude` MCP config. With `aiwork` alone, this table falls through to **Local** — that's the expected degradation, not a fault.

## Report destination

| Condition                                                                                              | Destination                                                                                      |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `--print`                                                                                              | stdout                                                                                           |
| `--out <path>`                                                                                         | that path                                                                                        |
| An artifact-protocol skill is available (`aiwork-protocol` ships alongside this skill)                 | invoke it and let it decide the path                                                             |
| A project artifact convention is evident (existing folder of specs, reports, or per-task work folders) | follow it — reuse the folder that already covers this ticket/slug rather than creating a sibling |
| none of the above                                                                                      | ask: print only (default) / `/tmp/triage-{slug}.md` / other path                                 |

Detect a convention, don't impose one. Signals: a protocol skill whose description covers where work artifacts go, or an existing directory holding prior triage/spec/review markdown. No signal → ask. Triage never creates a new artifact tree on its own.
