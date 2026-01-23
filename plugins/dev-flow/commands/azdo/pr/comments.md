---
name: df:azdo:pr:comments
allowed-tools: Bash(az devops invoke:*), Bash(az repos pr:*), Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Glob, Grep, Read, Task
description: Assess Azure DevOps PR comments against current codebase state
argument-hint: [pr-id]
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`

## Task

Fetch PR comments from Azure DevOps and assess each against the current codebase state.

**Arguments (`$ARGUMENTS`):** PR ID number (optional - will attempt auto-detection)

## Workflow

### 1. Pre-flight Checks

**Uncommitted changes:**

```bash
git status --porcelain
```

If output non-empty → **WARN**: "Uncommitted changes detected. Comments assessment may not reflect your latest work."

### 2. Determine PR ID

Priority:

1. If `$ARGUMENTS` contains a number → use it
2. Try auto-detect from current branch:
   ```bash
   az repos pr list --source-branch "$(git branch --show-current)" --status active --query '[0].pullRequestId' -o tsv
   ```
3. If still not found → **ASK** user for PR ID

### 3. Verify Branch Match

```bash
az repos pr show --id <pr-id> --query 'sourceRefName' -o tsv
```

Extract branch name (strip `refs/heads/`). Compare to current branch.

If mismatch → **WARN**: "Current branch `<current>` differs from PR source branch `<pr-branch>`. Comments may reference different code."

### 4. Fetch PR Threads

```bash
az devops invoke \
  --area git \
  --resource pullRequestThreads \
  --route-parameters \
    project=ecommerce-operations \
    repositoryId=drmax-nsf-global \
    pullRequestId=<PR_ID> \
  -o json
```

**Note:** Adjust `project` and `repositoryId` based on current repo's remote or `az devops configure --list`.

### 5. Parse Comments

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

### 6. Assess Each Comment

For each active/pending comment:

1. **Read the file** at the specified path
2. **Check the line** referenced (account for potential line shifts from subsequent commits)
3. **Determine status:**
   - ✅ **Addressed** - Code changed to address the feedback
   - 🔄 **Partially addressed** - Some changes made, but feedback not fully resolved
   - ❌ **Not addressed** - Original code unchanged, feedback still applicable
   - ❓ **Unable to assess** - File deleted, heavily refactored, or comment unclear

4. **Provide brief assessment** - What changed (or didn't) and whether it addresses the feedback
5. **Draft reply** (for unaddressed/partial) - Clear, direct explanation (no hollow praise)

### 7. Output Summary

```
## PR #<id> Comments
<warnings section only if any>

### Comments

<status-emoji> **<file-path>:<line>** (<author>)
> <comment-text>
<assessment in 1-2 sentences>
**Reply:** <proposed reply if unaddressed/partial>

---

**Totals:** ✅ X addressed · 🔄 X partial · ❌ X pending · ❓ X unclear

```

## Notes

- Only assesses **active** threads (skips closed/resolved)
- Line numbers may shift - look for nearby context if exact line doesn't match
- Use `az devops invoke` for threads API (not directly exposed in `az repos pr`)

## Posting Reply (if user requests)

```bash
az devops invoke \
  --area git \
  --resource pullRequestThreadComments \
  --route-parameters \
    project=ecommerce-operations \
    repositoryId=drmax-nsf-global \
    pullRequestId=<PR_ID> \
    threadId=<THREAD_ID> \
  --http-method POST \
  --in-file <(cat <<'EOF'
{"content": "<reply-content>"}
EOF
) \
  -o json
```

**Verify success:** Check response contains `"id":` field with a comment ID number. Do NOT retry if first attempt returns valid JSON with an ID — that means it succeeded.
