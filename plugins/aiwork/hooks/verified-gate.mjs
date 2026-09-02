#!/usr/bin/env node
// aiwork verified-gate — holds the end of a turn (exit 2) when a ticket claims
// `status: done` without evidence of an on-app pass (`behaviour`, `ux` or
// `human` in `verified:`) or with acceptance criteria still `- [ ]`, or when a
// review report lacks `reviewed_sha:` or names a commit unreachable from HEAD.
//
// Looks at tickets and review reports that are uncommitted or changed in HEAD,
// in every worktree of the repo (implementer subagents work in their own).
// Runs on Stop and SubagentStop. Fails open on anything it cannot determine.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const ARTIFACT = /(^|\/)\.aiwork\/[^/]+\/(tickets\/[^/]+|review(_\d+)?)\.md$/
const ON_APP_PASSES = ["behaviour", "ux", "human"]

// --- helpers ---------------------------------------------------------------

// Runs git in `cwd`, returns trimmed stdout. Throws on a non-zero exit.
function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim()
}

function lines(text) {
  return text.split("\n").filter(Boolean)
}

// Value of a top-level frontmatter field, quotes stripped. "" when absent.
function field(text, name) {
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ""
  const value =
    frontmatter.match(new RegExp(`^${name}:\\s*(.*)`, "m"))?.[1] ?? ""
  return value.replaceAll(/["']/g, "").trim()
}

// Paths of files that are uncommitted or changed in HEAD, relative to `wt`.
function touched(wt) {
  const uncommitted = lines(
    git(wt, "status", "--porcelain", "--untracked-files=all"),
  ).map((l) => l.slice(3).replace(/^.* -> /, "")) // drop status columns; keep the new name of a rename
  const inHead = lines(
    git(wt, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"),
  )
  return [...new Set([...uncommitted, ...inHead])].sort()
}

// --- checks ----------------------------------------------------------------

function checkTicket(path, text) {
  const problems = []
  if (field(text, "status") !== "done") return problems

  const verified = field(text, "verified").replaceAll(/[\[\] ]/g, "") // "[checks, review]" -> "checks,review"
  if (!verified.split(",").some((pass) => ON_APP_PASSES.includes(pass))) {
    problems.push(
      `${path} is \`status: done\` with \`verified: [${verified}]\` — no on-app pass (\`behaviour\`, \`ux\` or \`human\`).`,
    )
  }

  // Unticked boxes under the "Acceptance ..." heading, up to the next heading.
  const section =
    text.split(/^##+[ \t]*Acceptance.*$/m)[1]?.split(/^##+[ \t]/m)[0] ?? ""
  const open = section.match(/^\s*- \[ \]/gm)?.length ?? 0
  if (open > 0) {
    problems.push(
      `${path} is \`status: done\` with ${open} acceptance criteria still unticked.`,
    )
  }
  return problems
}

function checkReview(wt, path, text) {
  const sha = field(text, "reviewed_sha")
  if (!sha) {
    return [
      `${path} has no \`reviewed_sha:\` — nothing says which commit the review read.`,
    ]
  }
  try {
    git(wt, "merge-base", "--is-ancestor", sha, "HEAD")
    return []
  } catch {
    return [
      `${path} claims \`reviewed_sha: ${sha}\`, which is not reachable from HEAD.`,
    ]
  }
}

// --- main ------------------------------------------------------------------

function run() {
  const payload = JSON.parse(readFileSync(0, "utf8"))
  if (payload.stop_hook_active) return [] // never block twice on the same condition
  const cwd = payload.cwd || process.cwd()

  const worktrees = lines(git(cwd, "worktree", "list", "--porcelain"))
    .filter((l) => l.startsWith("worktree "))
    .map((l) => l.slice("worktree ".length))

  const problems = []
  for (const wt of worktrees) {
    if (!existsSync(join(wt, ".aiwork"))) continue
    for (const f of touched(wt)) {
      const path = join(wt, f)
      if (!ARTIFACT.test(f) || !existsSync(path)) continue
      const text = readFileSync(path, "utf8")
      problems.push(
        ...(f.includes("/tickets/")
          ? checkTicket(path, text)
          : checkReview(wt, path, text)),
      )
    }
  }
  return problems
}

let problems
try {
  problems = run()
} catch {
  process.exit(0) // fail open: bad stdin, not a git repo, git missing
}
if (problems.length === 0) process.exit(0)

process.stderr
  .write(`Not done yet — the aiwork verified-gate is holding this turn open. A ticket claims more than its evidence supports:

${problems.map((p) => `  - ${p}`).join("\n")}

Run the missing pass, then record it:

  - /verify <ticket-path>   -> tick the acceptance criteria it passed, add \`behaviour\` to \`verified:\`
  - a UX or human pass      -> add \`ux\` or \`human\`
  - a review report         -> set \`reviewed_sha:\` to the commit it read

Do not edit the frontmatter to get past this. If a pass genuinely cannot run,
set the ticket back to \`in-progress\`, record why in implementation-notes.md,
and commit that.
`)
process.exit(2)
