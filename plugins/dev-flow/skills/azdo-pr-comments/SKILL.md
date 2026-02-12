---
name: df:azdo-pr-comments
description: Manage Azure DevOps PR comments - post new code comments, read and assess existing threads. Trigger when user asks to add/post a comment on a PR, review PR feedback, or check PR comment status.
---

# Azure DevOps PR Comments

Read, assess, and post code-level comments on Azure DevOps pull requests.

## API Reference

The `az repos pr` CLI does not support PR threads. Use `az devops invoke` for all thread operations.

Detect `project` and `repositoryId` from git remote or `az devops configure --list`.

### Fetch all threads

```bash
az devops invoke \
  --area git \
  --resource pullRequestThreads \
  --route-parameters \
    project=<project> \
    repositoryId=<repo-name-or-id> \
    pullRequestId=<pr-id> \
  -o json
```

### Create thread on file/line

```bash
az devops invoke \
  --area git \
  --resource pullRequestThreads \
  --route-parameters \
    project=<project> \
    repositoryId=<repo-name-or-id> \
    pullRequestId=<pr-id> \
  --http-method POST \
  --in-file <(cat <<'EOF'
{
  "comments": [
    {
      "parentCommentId": 0,
      "content": "Comment text (markdown supported)",
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
EOF
)
```

**Thread status:** 0 = unknown, 1 = active, 2 = fixed, 3 = won't fix, 4 = closed, 5 = by design, 6 = pending

**Line targeting:**

- `rightFileStart`/`rightFileEnd` - new code (most common)
- `leftFileStart`/`leftFileEnd` - deleted code
- Single line: same start and end
- Omit `threadContext` entirely for a general (non-file) comment

### Reply to existing thread

```bash
az devops invoke \
  --area git \
  --resource pullRequestThreadComments \
  --route-parameters \
    project=<project> \
    repositoryId=<repo-name-or-id> \
    pullRequestId=<pr-id> \
    threadId=<thread-id> \
  --http-method POST \
  --in-file <(cat <<'EOF'
{"content": "Reply text"}
EOF
)
```

**Verify success:** Response contains `"id":` field. Do NOT retry if first attempt returns valid JSON with an ID.

## Posting: Comment Text Style

When posting review comments to PRs, be concise:

- State the issue directly - no header, no title, no label prefix
- File context is already visible in the PR UI, don't repeat it
- No dramatic impact predictions ("will cause X", "breaks Y")
- No bold wrapping of the whole message
- One sentence is ideal, two max

```
# Good
Orphaned `</a>` tags after refactoring.

# Good
`useI18n()` not called - `t` will be undefined.

# Bad
**C1. Broken HTML in PharmacistsCarousel**
Orphaned `</a>` tags and bare HTML attributes not attached to any element.
**Will cause template compilation error or mangled rendering.**
```

## Assessing: Reading Existing Comments

### Parse threads

Extract code comments (threads with file context):

```bash
jq '[.value[] | select(.threadContext.filePath) | select(.status == "closed" | not) | {
  id: .id,
  file: .threadContext.filePath,
  line: .threadContext.rightFileStart.line,
  status: .status,
  comment: .comments[0].content,
  author: .comments[0].author.displayName
}]'
```

### Assess each comment

For each active/pending comment:

1. Read the file at the specified path
2. Check the referenced line (account for line shifts from subsequent commits)
3. Determine status:
   - Addressed - code changed to address the feedback
   - Partially addressed - some changes, not fully resolved
   - Not addressed - original code unchanged
   - Unable to assess - file deleted, heavily refactored, or comment unclear
4. Provide brief assessment (1-2 sentences)

### Determine PR ID

Priority:

1. Explicit argument
2. Auto-detect from current branch:
   ```bash
   az repos pr list --source-branch "$(git branch --show-current)" --status active --query '[0].pullRequestId' -o tsv
   ```
3. Ask user
