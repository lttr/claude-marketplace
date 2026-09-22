# Triage Sources

Pluggable inputs and outputs for `aiwork:triage`. Nothing here is required — every path degrades to "ask the user to paste the text" or "save to /tmp".

## Ticket fetch

A tracker is whatever holds the ticket — a hosted service, a CLI, an MCP server, or a directory of markdown files in this repo. Inventory what this environment actually offers, then pick the first path that exists. Detect, don't assume.

| Access path           | Detect                                                                                                                                   | Fetch                                                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project skill**     | A skill in this project whose description covers reading tickets or work items                                                           | Invoke it — it knows the local conventions better than anything here                                                                                                                                                                      |
| **Azure DevOps CLI**  | `az` on PATH + `azure-devops` extension; URL has `_workitems/edit/<id>`                                                                  | `az boards work-item show --id <id> --expand all -o json`. The `ticket` skill (ships with the `dev-azdo` plugin) covers projections and linked PRs via `ticket show <id>` — invoke it if installed; otherwise use the command as written. |
| **GitHub CLI**        | `gh` on PATH; URL has `github.com/<org>/<repo>/issues/<n>`                                                                               | `gh issue view <id> --json title,body,state,labels,assignees,comments`                                                                                                                                                                    |
| **Other tracker CLI** | Some other tracker CLI on PATH, with a documented read command                                                                           | Its own read command, taken from `--help` or the project's docs — never from memory                                                                                                                                                       |
| **Tracker MCP**       | Any connected issue-tracker MCP server; the id shape matches its scheme                                                                  | Its own issue-read tool                                                                                                                                                                                                                   |
| **Local files**       | Tickets live in the repo — a backlog directory, `issues/`, `.aiwork/`, one markdown file per item, or a structured list in a single file | Read the matching file or entry. Follow the repo's own id-to-path convention; glob for the id if the convention isn't stated.                                                                                                             |
| **Nothing found**     | —                                                                                                                                        | Ask the user to paste the ticket text                                                                                                                                                                                                     |

Rules:

- Never guess a CLI invocation, a file layout, or an API endpoint. If the tool isn't on PATH, the server isn't connected, or the convention isn't evident, ask.
- Bare ids are ambiguous when more than one path is available — ask which, rather than trying each in turn.
- Read-only. Triage never writes back to the tracker, and never creates a ticket file that was missing.

Normalize the response to: title, description, acceptance criteria, state, type, assignee, area / labels, linked items.

## Docs search

Optional enrichment in step 2. Inventory what this session actually has, then use it — connected MCP servers, hosted wikis and knowledge bases, doc-fetch tools, and the repo itself. Detect, don't assume: a source counts only if its tools are present right now.

| Source              | Detect                                                                                                      | Use                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Connected wiki**  | Tools for a wiki or knowledge base — an MCP server (Confluence, Notion, an internal KB) or a documented CLI | Search by title keywords, area/feature name, domain terms                       |
| **Connected tools** | Any other MCP server that reads docs, specs or design material                                              | Its own search/read tool, for the same query set                                |
| **Web**             | `WebSearch` / `WebFetch`                                                                                    | Only for public/vendor docs the requirement depends on                          |
| **Local**           | always                                                                                                      | `docs/`, `wiki/`, ADRs, OpenAPI specs, `ARCHITECTURE.md`, `.aiwork/` prior work |

Rules:

- Name the source you actually queried in the report. Don't report an external search that didn't happen, and don't name a tool you didn't call.
- No external source connected → local docs only. That is the expected degradation, not a fault.
- Read-only throughout. Triage never writes to a wiki.

Wiki access is never bundled with `aiwork`. It comes from a plugin that ships an MCP server (the `confluence` plugin in this marketplace does, for Atlassian) or from the user's own MCP config.

## Report destination

| Condition                                                                                              | Destination                                                                                      |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `--print`                                                                                              | stdout                                                                                           |
| `--out <path>`                                                                                         | that path                                                                                        |
| An artifact-protocol skill is available (`aiwork-protocol` ships alongside this skill)                 | invoke it and let it decide the path                                                             |
| A project artifact convention is evident (existing folder of specs, reports, or per-task work folders) | follow it — reuse the folder that already covers this ticket/slug rather than creating a sibling |
| none of the above                                                                                      | ask: print only (default) / `/tmp/triage-{slug}.md` / other path                                 |

Detect a convention, don't impose one. Signals: a protocol skill whose description covers where work artifacts go, or an existing directory holding prior triage/spec/review markdown. No signal → ask. Triage never creates a new artifact tree on its own.
