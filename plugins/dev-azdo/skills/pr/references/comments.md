# pr comments

Read, assess, and post code-level comments on Azure DevOps pull requests.

## Determine the PR id

Priority:

1. Explicit in the request
2. The current branch's PR. `git branch --show-current` gives the branch, then:
   ```bash
   az repos pr list --source-branch <BRANCH> --status active --query "[0].pullRequestId" -o tsv
   ```
3. Ask the user

## API reference

`az repos pr` does not support PR threads. Use `az devops invoke` for all thread operations.

Resolve org, project and repo as described in the conventions (`${CLAUDE_PLUGIN_ROOT}/references/conventions.md`),
print them, and paste the literals below. `invoke` needs `--org`, an explicit `project` route
parameter and `--api-version 7.1`.

### Fetch all threads

```bash
az devops invoke --org <ORG_URL> --area git --resource pullRequestThreads --route-parameters project=<PROJECT> repositoryId=<REPO> pullRequestId=<PR_ID> --api-version 7.1 -o json
```

### Create a thread on a file/line

Body file (see "Request bodies" in the conventions):

```json
{
  "comments": [
    {
      "parentCommentId": 0,
      "content": "Comment text (Markdown supported)",
      "commentType": 1
    }
  ],
  "threadContext": {
    "filePath": "/path/to/file.vue",
    "rightFileStart": { "line": 31, "offset": 1 },
    "rightFileEnd": { "line": 38, "offset": 1 }
  },
  "status": 1
}
```

```bash
az devops invoke --org <ORG_URL> --area git --resource pullRequestThreads --route-parameters project=<PROJECT> repositoryId=<REPO> pullRequestId=<PR_ID> --http-method POST --in-file <PATH> --api-version 7.1 -o json
```

**Thread status.** POST takes a number, GET returns a string:

| Write (number) | Read (string) |
| -------------- | ------------- |
| 0              | `unknown`     |
| 1              | `active`      |
| 2              | `fixed`       |
| 3              | `wontFix`     |
| 4              | `closed`      |
| 5              | `byDesign`    |
| 6              | `pending`     |

**Line targeting:**

- `rightFileStart`/`rightFileEnd`: new code (most common)
- `leftFileStart`/`leftFileEnd`: deleted code
- Single line: same start and end
- `filePath` is repo-rooted with a leading `/`
- Omit `threadContext` entirely for a general (non-file) comment

### Reply to an existing thread

Body file: `{"content": "Reply text"}`

```bash
az devops invoke --org <ORG_URL> --area git --resource pullRequestThreadComments --route-parameters project=<PROJECT> repositoryId=<REPO> pullRequestId=<PR_ID> threadId=<THREAD_ID> --http-method POST --in-file <PATH> --api-version 7.1 -o json
```

**Verify success:** the response contains an `"id"` field. Do NOT retry if the first attempt
returned valid JSON with an id.

## Posting

Every thread and reply goes through the approval gate in the conventions. For each one, show:

```
<file path>, lines <start>-<end> (right side)   (or: general comment / reply to thread <id>)
<THE FULL COMMENT BODY, verbatim>
```

Comment text follows the writing guideline in the conventions. The file and line are already
visible in the PR UI, so the body doesn't repeat them.

### Posting review findings

Findings from a review (for example `aiwork:code-review-diff`) map to threads one to one:

1. Each finding becomes one thread: `filePath` from the finding's file, `rightFileStart` /
   `rightFileEnd` from its line range on the PR's source side, body from the finding. A finding
   without a usable location becomes a general comment.
2. Drop severity labels, ids and headers from the body. The body is the finding itself.
3. Show the whole batch at once, numbered, in the format above.
4. Post only after a go-ahead that explicitly covers the batch ("post all", "post 1, 3 and 4").
   Anything else is not approval. If the user edits or drops items, show the new batch again.
5. Report each posted thread's id, and any that failed.

## Assessing existing comments

### Parse threads

From the fetched threads, keep code comments that are still open: `threadContext.filePath` is
set and `status` is `active` or `pending`. System threads (merge attempts, votes, ref updates)
have no `threadContext` and drop out. With jq, for example:

```
[.value[] | select(.threadContext.filePath) | select(.status == "active" or .status == "pending") | {id, file: .threadContext.filePath, line: .threadContext.rightFileStart.line, status, comment: .comments[0].content, author: .comments[0].author.displayName}]
```

### Assess each comment

1. Read the file at the specified path
2. Check the referenced line (account for line shifts from later commits)
3. Determine status:
   - Addressed: code changed to address the feedback
   - Partially addressed: some changes, not fully resolved
   - Not addressed: original code unchanged
   - Unable to assess: file deleted, heavily refactored, or comment unclear
4. Give a brief assessment (1-2 sentences)
