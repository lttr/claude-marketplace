# dev-azdo conventions

## Shell-neutral recipes

Recipes spell out only `az` and `git` calls. Everything else is intent ("if empty, stop and
ask"). Parse output with whatever the environment offers.

Shell variables don't survive between tool calls. Resolve a value, print it, paste the literal.
`<ANGLE_BRACKET>` names are placeholders for literals.

## Azure DevOps remote

`git remote get-url origin` contains `dev.azure.com` or `visualstudio.com`:

- `https://[<user>@]dev.azure.com/<org>/<project>/_git/<repo>`
- `git@ssh.dev.azure.com:v3/<org>/<project>/<repo>`
- `https://<org>.visualstudio.com/[DefaultCollection/]<project>/_git/<repo>`
- `<org>@vs-ssh.visualstudio.com:v3/<org>/<project>/<repo>`

Segments are URL-encoded. Decode before passing them as arguments.

## Org, project, repo

First source that yields a value:

1. The request
2. The Azure DevOps remote. Org URL is `https://dev.azure.com/<org>` or `https://<org>.visualstudio.com`
3. `AZDO_ORG_URL` / `AZDO_PROJECT`
4. `az devops configure --list` (INI-style output, ignores `--query`)
5. Ask. Never guess or reuse values seen elsewhere.

The repo comes only from the remote. `az repos` and `az boards` detect org and project on their
own. Pass `--org` / `--project` only when that fails.

- `az devops invoke`: pass `--org <ORG_URL>`, `project=<PROJECT>` as a route parameter, and
  `--api-version 7.1` (default is 5.0).
- `az rest`: pass `--resource 499b84ac-1321-427f-aa17-267ca6975798`, or the call fails with
  TF400813. URLs are `<ORG_URL>/<PROJECT>/_apis/…`, spaces as `%20`.

## Default branch

Never assume `main` or `master`.

1. `git symbolic-ref --short refs/remotes/origin/HEAD`, minus the `origin/` prefix
2. `az repos show --repository <REPO> --query defaultBranch -o tsv`, minus `refs/heads/`
3. Ask

## Approval gate

Applies to every write others see: work items, work-item comments, opening a PR, PR threads and
replies, completing a PR. They notify people, and deleting doesn't un-send that.

Print what will happen (each recipe lists the fields) and wait for an explicit go-ahead.

- Full text, verbatim, not a summary.
- A request to write is a request to draft, not approval.
- If the user amends the draft, show it again.
- One approval per write, unless the user explicitly approves a shown batch.
- Skip only if the user said, in this session, to write without review.

## Writing

For everything written to Azure DevOps:

> Readers skim these in a notification. Lead with the point and keep it short. Add structure
> only where it helps the reader act, like a "How to test" section in a PR description. Length
> comes from facts the reader needs, not from filler.

## Request bodies

Write the JSON with the Write tool into the OS temp directory (`/tmp`, `%TEMP%`), pass it as
`--body @<PATH>` (`az rest`) or `--in-file <PATH>` (`az devops invoke`), and delete it afterwards.
