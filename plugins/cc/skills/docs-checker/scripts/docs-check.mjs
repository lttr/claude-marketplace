#!/usr/bin/env node
/**
 * docs-check — offline linter for markdown documentation. No config file, no dependencies.
 *
 *   docs-check [paths...] [--repo=NAME:DIR]...
 *
 * Rules, all resolved against the working tree:
 *
 *   link-file    [text](./page.md) or [text](/section/page) targets that do not exist
 *   asset        ![img](/foo.png) found neither under the docs root nor its public/ dir
 *   code-ref     backticked source paths in prose (`src/foo.ts`, `@alias/bar`) that no
 *                longer exist in the codebase the page documents
 *
 * The last rule is the one a link checker cannot cover: those paths are prose, not links,
 * so nothing notices when the file they name is renamed or deleted. External http links are
 * out of scope — a dedicated link checker does that better, and it needs the network.
 *
 * #fragments are deliberately not checked. Which heading yields which id is decided by whatever
 * renders the site, and every renderer answers differently (GitHub deletes `&`, mdit-vue turns
 * it into `-`, one deburrs accents and the other does not). Matching one of them means silently
 * mismatching the rest, so the rule was dropped rather than made confidently wrong.
 *
 * Alongside the paths you name, every repo's agent instructions are scanned too: `CLAUDE.md` at
 * any depth and the whole `.claude/` tree (skills, rules, commands). They document the code as
 * directly as docs/ does, are read far more often, and nothing else looks at them — a normal
 * scan cannot even see them, since it skips dotted directories. `--no-agent-docs` opts out.
 *
 * Everything is inferred:
 *
 *   targets     the paths you name, or this repo's docs tree (docs/, content/, …) when you name
 *               none — so the bare command is the useful one, not a scan of every stray README.
 *   repos       the current directory, plus any --repo=NAME:DIR. A missing one warns.
 *   scope       a page under a directory named after a repo is checked against that repo
 *               only (docs/…/client/setup.md -> the repo named "client"); an agent doc against
 *               the repo it lives in; anything else may reference any of them.
 *   aliases     tsconfig/jsconfig compilerOptions.paths, package.json imports/_moduleAliases
 *   paths       a backticked string is a path when it contains a separator and starts with
 *               an alias or a real top-level directory of the repo
 *   docs root   the directory you point it at, and its public/ for absolute assets
 *
 * Findings print as `line:col  rule  message` under a file header, with the offending line
 * quoted and a did-you-mean from an index of every file in every repo. Fenced code and <pre>
 * blocks are skipped: their paths are illustrative and were never meant to resolve.
 * Suppress one line with a trailing <!-- docs-check-ignore -->, or a region between
 * <!-- docs-check-disable --> and <!-- docs-check-enable -->.
 *
 * Exit 0 clean, 1 findings, 2 bad invocation.
 */
import { execFileSync } from "node:child_process"
import { globSync, readFileSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, join, relative, resolve, sep } from "node:path"

const argv = process.argv.slice(2)
const targets = argv.filter((a) => !a.startsWith("--"))
const CWD = process.cwd()

const fail = (msg) => {
  console.error(`docs-check: ${msg}`)
  process.exit(2)
}
const stat = (p) => statSync(p, { throwIfNoEntry: false })
const isFile = (p) => stat(p)?.isFile() ?? false
const isDir = (p) => stat(p)?.isDirectory() ?? false

/* ------------------------------------------------------------------ input */

/** Skips build output and dotted directories. Judged on the path below the scan root, so a
 *  checkout that itself sits under e.g. ~/.local does not filter itself away. */
const ignored = (rel) =>
  rel.split("/").some((s) => s === "node_modules" || s.startsWith("."))

/** What a documentation tree is conventionally called. First match wins, so a repo with both
 *  `docs/` and `content/` gets the same answer on every machine, whatever readdir order says. */
const DOCS_DIRS = ["docs", "doc", "documentation", "website", "content"]

/** Given no paths, scan the repo's documentation tree rather than the entire checkout: every
 *  stray README and CHANGELOG is markdown too, and none of it is what this is for. Agent docs
 *  come along regardless. Only a repo with no docs tree at all falls back to everything. */
const scan = targets.length
  ? targets
  : [DOCS_DIRS.find((d) => isDir(join(CWD, d))) ?? "."]

const named = scan.flatMap((t) => {
  const abs = resolve(CWD, t)
  if (!isDir(abs)) return [abs]
  return globSync("**/*.md", { cwd: abs, exclude: ignored }).map((p) =>
    join(abs, p),
  )
})

/** Root for /absolute links: the scanned directory, or the docs-ish ancestor of a scanned file. */
const DOCS_ROOT = (() => {
  const first = resolve(CWD, scan[0])
  if (isDir(first)) return first
  for (let dir = dirname(first); dir !== dirname(dir); dir = dirname(dir))
    if (DOCS_DIRS.includes(basename(dir).toLowerCase())) return dir
  return dirname(first)
})()
const ASSET_ROOTS = [join(DOCS_ROOT, "public"), DOCS_ROOT]

/* ------------------------------------------------------------------ repos */

const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".json",
]
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "vendor",
])

/** JSON with comments and trailing commas — tsconfig.json is rarely strict JSON. */
function readJsonc(file) {
  const text = readFileSync(file, "utf8")
    .replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      (m, comment) => (comment ? "" : m),
    )
    .replace(/,(\s*[}\]])/g, "$1")
  try {
    return JSON.parse(text)
  } catch (e) {
    fail(`cannot parse ${file}: ${e.message}`)
  }
}

/**
 * Import aliases, read from the code that defines them rather than restated here, so the
 * check cannot drift from the aliases the codebase actually uses. Returns `@alias` -> dir.
 */
function readAliases(dir) {
  const alias = {}
  const put = (key, value) => {
    if (key && value && !(key in alias))
      alias[key.replace(/\/\*$/, "")] = value.replace(/\/\*$/, "")
  }
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    let file = join(dir, name)
    for (let depth = 0; isFile(file) && depth < 5; depth++) {
      const cfg = readJsonc(file)
      const baseUrl = cfg.compilerOptions?.baseUrl ?? "."
      for (const [from, to] of Object.entries(cfg.compilerOptions?.paths ?? {}))
        put(from, join(baseUrl, String(to[0] ?? "")))
      file = cfg.extends?.startsWith(".")
        ? resolve(dirname(file), cfg.extends)
        : ""
    }
  }
  const pkgFile = join(dir, "package.json")
  const pkg = isFile(pkgFile) ? readJsonc(pkgFile) : {}
  for (const [from, to] of Object.entries(pkg._moduleAliases ?? {}))
    put(from, to)
  for (const [from, to] of Object.entries(pkg.imports ?? {}))
    if (typeof to === "string") put(from, to)
  return alias
}

/** Every file in the repo. Uses git when available so ignored output stays out, walks otherwise. */
function listFiles(dir) {
  try {
    const out = execFileSync("git", ["ls-files"], {
      cwd: dir,
      encoding: "utf8",
      maxBuffer: 128e6,
      stdio: ["ignore", "pipe", "ignore"], // stay quiet when this is not a checkout
    })
    if (out.trim()) return out.split("\n").filter(Boolean)
  } catch {
    /* not a git checkout — fall through to walking it */
  }
  const walk = (rel) =>
    readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
      if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) return []
      const child = rel ? `${rel}/${e.name}` : e.name
      return e.isDirectory() ? walk(child) : [child]
    })
  return walk("")
}

const declared = argv
  .filter((a) => a.startsWith("--repo="))
  .map((a) => a.slice(7))
  .map((v) => {
    const colon = v.indexOf(":")
    if (colon < 1) fail(`--repo needs NAME:DIR, got "${v}"`)
    return { name: v.slice(0, colon), dir: v.slice(colon + 1) }
  })
if (!declared.some((r) => resolve(CWD, r.dir) === CWD))
  declared.unshift({ name: basename(CWD), dir: "." })

const repos = []
for (const { name, dir: rel } of declared) {
  const dir = resolve(CWD, rel)
  if (!isDir(dir)) {
    console.warn(
      `warn: repo "${name}" not found at ${dir} — its code refs are not checked`,
    )
    continue
  }
  const files = listFiles(dir)
  const alias = readAliases(dir)
  repos.push({
    name,
    dir,
    files,
    // Longest prefix first, so `@common/x` cannot be captured by a shorter `@c` alias.
    aliases: Object.entries(alias).sort((a, b) => b[0].length - a[0].length),
    // A string only looks like a path if it starts under a directory the repo really has.
    // Derived per repo, so a flat src/ layout and a Nuxt-style spread of top-level
    // directories both work without being told what to expect.
    roots: new Set(
      files.filter((f) => f.includes("/")).map((f) => f.split("/")[0]),
    ),
  })
}
if (!repos.length) fail("no repository to resolve code references against")
const open = new Set(repos.map((r) => r.name))

/* ------------------------------------------------------------- agent docs */

/**
 * A repo's instructions to coding agents: `CLAUDE.md` at any depth, plus every page of its
 * `.claude/` tree. Walked rather than read from `git ls-files`, because a skill is useful long
 * before anyone commits it, and an uncommitted one that cites a moved path misleads all the same.
 *
 * `worktrees/` is skipped wherever it appears: those hold whole checkouts of the repo, to be
 * scanned as themselves or not at all — walking into one doubles every finding and blames the
 * copy's stale paths on the original. Symlinked directories are left alone for the same reason.
 */
function agentDocs(dir) {
  const walk = (rel, inside) =>
    readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
      const child = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name) || e.name === "worktrees") return []
        if (e.name.startsWith("."))
          return e.name === ".claude" ? walk(child, true) : []
        return walk(child, inside)
      }
      if (!(inside ? e.name.endsWith(".md") : e.name === "CLAUDE.md")) return []
      return [join(dir, child)]
    })
  return walk("", false)
}

/**
 * Agent doc -> the root its relative links are written against. An agent reads these with the
 * working directory at the repo root, so they say `[docs/i18n.md](docs/i18n.md)` from inside
 * `.claude/rules/` and mean it; judging them the way a site generator would makes every such
 * link a finding. Both roots are accepted, since the same file is also read on a git host.
 */
const agentRoot = new Map()
if (!argv.includes("--no-agent-docs"))
  for (const repo of repos)
    for (const f of agentDocs(repo.dir)) agentRoot.set(f, repo.dir)

const files = [...new Set([...named, ...agentRoot.keys()])]
if (!files.length) fail("nothing to scan")

/** basename -> [{repo, path}], built on first use: only a failed reference ever asks for it. */
let fileIndex = null
const indexOf = (name) =>
  (fileIndex ??= Map.groupBy(
    repos.flatMap((r) => r.files.map((path) => ({ repo: r.name, path }))),
    (hit) => basename(hit.path),
  )).get(name) ?? []

/* -------------------------------------------------------- reference lookup */

const underAlias = (rel, alias) => rel === alias || rel.startsWith(alias + "/")

/** `src/foo.ts:12` and `src/foo.ts:30-35` cite a line in a file, so the anchor is not part of it. */
const stripAnchor = (ref) => ref.replace(/:\d+(?:-\d+)?$/, "")

/** Every directory of a repo, derived from its file list on first use: only a miss asks for it. */
const dirsOf = (repo) =>
  (repo.dirs ??= [
    ...new Set(
      repo.files.flatMap((f) => {
        const parts = f.split("/").slice(0, -1)
        return parts.map((_, i) => parts.slice(0, i + 1).join("/"))
      }),
    ),
  ])

/** Expand an alias prefix, then try the path as given, with each extension, and as a directory. */
function refExists(ref, repo) {
  const bare = stripAnchor(ref)
  let rel = bare.replace(/^\//, "").replace(/\/$/, "")
  for (const [alias, target] of repo.aliases)
    if (underAlias(rel, alias)) {
      rel = target + rel.slice(alias.length)
      break
    }
  const abs = join(repo.dir, rel)
  if (isFile(abs) || isDir(abs) || EXTENSIONS.some((e) => isFile(abs + e)))
    return true
  // A trailing slash names a convention rather than one artifact — "the layer's own
  // `server/routes/`" — so it is written relative to whatever nests it, not to the repo root.
  // Accepted wherever the repo really has it. Refs to a *file* stay anchored at the root: that
  // a named artifact still exists somewhere is exactly what this rule must not assume.
  return (
    bare.endsWith("/") &&
    dirsOf(repo).some((d) => d === rel || d.endsWith("/" + rel))
  )
}

/**
 * Is this backticked string confident enough to be worth a build failure? It must contain a
 * separator (`couldBePath`) and start with an alias or a top-level directory of some repo
 * (`isPathLike`). That excludes npm scopes (`@vitejs/plugin-vue`), git refs (`release/3.1.1`),
 * relative imports (`'../models'`), illustrative fragments (`models/index.ts`), elisions
 * (`layers/company-data/.../CRN.vue`) and bare filenames (`package.json`) — which typically
 * outnumber the real references, and would each be a false failure. The repo-independent half
 * is split out so it is tested once, not once per repo.
 */
const couldBePath = (str) =>
  str.includes("/") &&
  !/[\s{}*<>()|'",;=]/.test(str) &&
  !str.split("/").includes("...")

function isPathLike(str, repo) {
  const bare = str.replace(/^\//, "")
  return (
    repo.roots.has(bare.split("/")[0]) ||
    repo.aliases.some(([a]) => underAlias(bare, a))
  )
}

/** Where else does a file by this name live? Catches moves, renames and wrong-repo references. */
const suggest = (ref) =>
  indexOf(basename(stripAnchor(ref).replace(/\/$/, "")))
    .slice(0, 3)
    .map((h) => (repos.length > 1 ? `${h.path} (${h.repo})` : h.path))
    .join(", ")

/** Where a link written in this file may start: its own directory, or a root it is read from. */
const basesFor = (fromFile, target, absolute) => [
  ...(target.startsWith("/") ? absolute : [dirname(fromFile)]),
  ...(agentRoot.has(fromFile) ? [agentRoot.get(fromFile)] : []),
]

/** Resolve a link the way static site generators do: explicit file, implicit .md, directory index. */
function resolveDoc(fromFile, target) {
  const rel = target.replace(/^\//, "")
  for (const base of basesFor(fromFile, target, [DOCS_ROOT])) {
    const path = resolve(base, rel)
    const hit = [path, `${path}.md`, join(path, "index.md")].find(isFile)
    if (hit) return hit
  }
  return null
}

const assetExists = (fromFile, target) =>
  basesFor(fromFile, target, ASSET_ROOTS).some((base) =>
    isFile(resolve(base, target.replace(/^\//, ""))),
  )

/* -------------------------------------------------------------------- scan */

const findings = []
const stats = { links: 0, assets: 0, codeRefs: 0 }
const report = (loc, rule, msg, ctx, hint) => {
  const rel = relative(CWD, loc.file)
  findings.push({
    ...loc,
    file: rel.startsWith("..") ? loc.file : rel,
    rule,
    msg,
    ctx,
    hint,
  })
}

/**
 * A page under a directory named after a repo documents that repo; otherwise any of them. Agent
 * docs deliberately fall in the second group even though they ship inside one repo: a skill that
 * contrasts the two codebases ("mirrors the client `src/resources/endpoints/` exception") names
 * the sibling's paths on purpose, and scoping it to its own repo would fail every such line.
 * Scoping runs over the declared repos, not the open ones: a page is only judged when every
 * repo it may document was actually searched, else a missing checkout reads as a broken doc.
 */
function scopeOf(file) {
  const segments = new Set(relative(CWD, file).split(sep))
  const byDir = declared.filter((r) => segments.has(r.name)).map((r) => r.name)
  const names = byDir.length ? byDir : declared.map((r) => r.name)
  return {
    repos: repos.filter((r) => names.includes(r.name)),
    conclusive: names.every((n) => open.has(n)),
  }
}

for (const file of files) {
  const { repos: scope, conclusive } = scopeOf(file)

  let fence = false // inside ``` or ~~~
  let pre = false // inside <pre>, commonly used for directory diagrams
  let disabled = false // inside a docs-check-disable region

  readFileSync(file, "utf8")
    .split("\n")
    .forEach((raw, i) => {
      const line = i + 1
      const at = (col) => ({ file, line, col })
      if (/<!--\s*docs-check-disable\s*-->/.test(raw)) disabled = true
      if (/<!--\s*docs-check-enable\s*-->/.test(raw)) disabled = false
      if (/^\s*(?:```|~~~)/.test(raw)) {
        fence = !fence
        return
      }
      if (/<pre[\s>]/.test(raw)) pre = true
      if (/<\/pre>/.test(raw)) {
        pre = false
        return
      }
      if (disabled || /<!--\s*docs-check-ignore\s*-->/.test(raw)) return
      // Paths inside code are illustrative and were never meant to resolve.
      if (fence || pre) return

      for (const m of raw.matchAll(/(!?)\[[^\]]*\]\(\s*(<[^>]*>|[^)\s]+)/g)) {
        const col = m.index + 1
        const url = m[2].replace(/^<|>$/g, "")
        if (/^[a-z][a-z0-9+.-]*:/i.test(url)) continue // http:, mailto:, … are out of scope

        if (m[1] === "!") {
          stats.assets++
          if (!assetExists(file, url))
            report(
              at(col),
              "asset",
              `missing asset: ${url}`,
              raw.trim(),
              suggest(url),
            )
          continue
        }

        // Only the page is checked; a #fragment is dropped. Whether it resolves depends on the
        // heading-id rule of whatever renders the site, so judging it here means guessing.
        const [path] = url.split("#")
        if (!path) continue // a bare #fragment says nothing about any file
        stats.links++
        if (!resolveDoc(file, path))
          report(
            at(col),
            "link-file",
            `link target does not exist: ${url}`,
            raw.trim(),
            suggest(url),
          )
      }

      for (const m of raw.matchAll(/`([^`\n]+)`/g)) {
        const ref = m[1]
        if (!couldBePath(ref)) continue
        const candidates = scope.filter((repo) => isPathLike(ref, repo))
        if (!candidates.length) continue
        stats.codeRefs++
        if (candidates.some((repo) => refExists(ref, repo)) || !conclusive)
          continue
        const where =
          repos.length > 1 && candidates.length === 1
            ? ` in ${candidates[0].name}`
            : ""
        const msg = `source path does not exist${where}: ${ref}`
        report(at(m.index + 1), "code-ref", msg, raw.trim(), suggest(ref))
      }
    })
}

/* ------------------------------------------------------------------ report */

findings.sort(
  (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.col - b.col,
)

let currentFile = null
for (const f of findings) {
  if (f.file !== currentFile) console.log(`\n${(currentFile = f.file)}`)
  console.log(`  ${f.line}:${f.col}  ${f.rule}  ${f.msg}`)
  if (f.ctx) console.log(`        | ${f.ctx}`)
  if (f.hint) console.log(`        ~ did you mean: ${f.hint}`)
}
// The counts double as a smoke test: a rule that suddenly checks nothing shows up here.
const scanned = `${files.length} file(s), ${stats.links} link(s), ${stats.assets} asset(s), ${stats.codeRefs} code ref(s)`
console.log(
  findings.length
    ? `\n${findings.length} finding(s) in ${scanned}.`
    : `clean: ${scanned}.`,
)

process.exit(findings.length ? 1 : 0)
