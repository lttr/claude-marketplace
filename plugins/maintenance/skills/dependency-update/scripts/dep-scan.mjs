#!/usr/bin/env node
// Deterministic scan for the dependency-update skill.
//
// It answers only what a machine can answer without judgement: what the
// package manager reports as outdated, which of those rows are off-limits
// anyway (exact pin, `catalog:`/`npm:` alias, override workaround) so they
// never surface as phantom work, where each package lives on GitHub, and —
// in a Nuxt repo — which packages are hoist-skewed. Release notes, impact,
// batching and DELETE-WHEN conditions need judgement, so they stay with the
// skill.
//
// Usage: node dep-scan.mjs [--root=DIR] [--no-net] [--tsconfig-paths=GLOB]
// Output: one JSON blob on stdout.

import { execFileSync } from "node:child_process"
import { existsSync, globSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"

const rootFlag = process.argv
  .find((a) => a.startsWith("--root="))
  ?.slice("--root=".length)
const offline = process.argv.includes("--no-net")
const tsconfigPathsGlob =
  process.argv
    .find((a) => a.startsWith("--tsconfig-paths="))
    ?.slice("--tsconfig-paths=".length) ?? null
const EXACT = /^\d+\.\d+\.\d+(?:[-+].*)?$/

function gitRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim()
  } catch {
    return null
  }
}

const repoRoot = resolve(rootFlag ?? gitRoot() ?? process.cwd())

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return null
  }
}

function readText(path) {
  try {
    return readFileSync(path, "utf8")
  } catch {
    return null
  }
}

/** pnpm or npm, decided by the lockfile at the repo root. */
function detectManager() {
  if (existsSync(join(repoRoot, "pnpm-lock.yaml"))) {
    return "pnpm"
  }
  if (existsSync(join(repoRoot, "package-lock.json"))) {
    return "npm"
  }
  if (existsSync(join(repoRoot, "yarn.lock"))) {
    return "yarn"
  }
  if (
    existsSync(join(repoRoot, "bun.lock")) ||
    existsSync(join(repoRoot, "bun.lockb"))
  ) {
    return "bun"
  }
  return existsSync(join(repoRoot, "pnpm-workspace.yaml")) ? "pnpm" : "npm"
}

const manager = detectManager()
const isWorkspace =
  existsSync(join(repoRoot, "pnpm-workspace.yaml")) ||
  Array.isArray(readJson(join(repoRoot, "package.json"))?.workspaces) ||
  Boolean(readJson(join(repoRoot, "package.json"))?.workspaces?.packages)

/** The manager's stdout, also on exit 1 (`outdated` exits 1 whenever anything is outdated). */
function run(cmd, ...args) {
  try {
    return execFileSync(cmd, args, {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    if (error.stdout) {
      return error.stdout
    }
    throw error
  }
}

/** Names under `overrides:` in pnpm-workspace.yaml, plus `overrides`/`resolutions` in the root manifest. */
function overriddenNames() {
  const names = new Set()
  const yaml = readText(join(repoRoot, "pnpm-workspace.yaml")) ?? ""
  const block = yaml.match(/^overrides:\n((?:[ \t#].*\n|\n)*)/m)?.[1] ?? ""
  for (const match of block.matchAll(
    /^[ \t]+["']?(@?[^"'#:\s]+)["']?[ \t]*:/gm,
  )) {
    names.add(match[1])
  }
  const pkg = readJson(join(repoRoot, "package.json")) ?? {}
  for (const key of Object.keys({
    ...pkg.overrides,
    ...pkg.resolutions,
    ...pkg.pnpm?.overrides,
  })) {
    names.add(key.replace(/[>@].*$/, "") || key)
  }
  return [...names]
}

function outOfScopeReason(name, spec, overrides) {
  if (!spec) {
    return "not a direct dependency — report only"
  }
  if (spec.startsWith("catalog:")) {
    return `catalog: alias — resolved by pnpm-workspace.yaml (${spec}), report only`
  }
  if (spec.startsWith("npm:")) {
    return `aliased spec (${spec}) — report only`
  }
  if (
    spec.startsWith("workspace:") ||
    spec.startsWith("link:") ||
    spec.startsWith("file:")
  ) {
    return `local spec (${spec}) — report only`
  }
  if (EXACT.test(spec)) {
    return `exact pin (${spec}) — deliberate, report only`
  }
  if (overrides.includes(name)) {
    return "covered by an override workaround — report only"
  }
  return null
}

/** Semver bump kind, treating a 0.x minor as the breaking digit. */
function bumpKind(current, latest) {
  if (!current || !latest) {
    return "unknown"
  }
  const [a, b] = [current, latest].map((v) =>
    v
      .replace(/^\D*/, "")
      .split(".")
      .map((n) => Number(n) || 0),
  )
  if (a[0] !== b[0]) {
    return "major"
  }
  if (a[1] !== b[1]) {
    return a[0] === 0 ? "major" : "minor"
  }
  return a[2] !== b[2] ? "patch" : "none"
}

function githubRepo(field) {
  const url = typeof field === "object" ? field?.url : field
  if (typeof url !== "string") {
    return null
  }
  const shorthand = url.replace(/^github:/, "")
  if (/^[\w.-]+\/[\w.-]+$/.test(shorthand)) {
    return shorthand.replace(/\.git$/, "")
  }
  return url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git|\/|$)/)?.[1] ?? null
}

async function resolveRepo(name, workspaceDir) {
  for (const base of [workspaceDir, repoRoot]) {
    const pkg = readJson(join(base, "node_modules", name, "package.json"))
    const repo = githubRepo(pkg?.repository) || githubRepo(pkg?.homepage)
    if (repo) {
      return { repo, repoSource: "node_modules" }
    }
  }
  if (offline) {
    return { repo: null, repoSource: "offline" }
  }
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${name.replace("/", "%2F")}`,
      {
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!response.ok) {
      return { repo: null, repoSource: "registry-miss" }
    }
    const data = await response.json()
    const manifest = data.versions?.[data["dist-tags"]?.latest]
    const repo =
      githubRepo(data.repository) ||
      githubRepo(manifest?.repository) ||
      githubRepo(data.homepage)
    return { repo, repoSource: repo ? "registry" : "registry-miss" }
  } catch (error) {
    return { repo: null, repoSource: `registry-error: ${error.message}` }
  }
}

// Packages installed at more than one major version.
//
// Under a flat or hoisted layout (pnpm's `shamefullyHoist`, npm's default)
// exactly one copy of a duplicated package reaches the root `node_modules`.
// Which copy wins is decided at install time, not by the lockfile, so a regen
// can switch what a bare `import ... from "<pkg>"` resolves to with nothing in
// the diff to explain it.
//
// `--tsconfig-paths=<glob>` additionally correlates each duplicate against the
// `compilerOptions.paths` of generated tsconfigs, which is where a framework
// records the copy it decided on. A row whose `pathsAt` disagrees with
// `hoistedAtRoot` is a latent typecheck break. Callers that know their
// framework's generated-tsconfig location pass it; without the flag the rows
// carry `pathsAt: null` and the duplicate list stands on its own.
//
// This reports candidates only. The cure is a pin naming the copy that should
// win, which is a judgement call.
function duplicateMajors() {
  const paths = tsconfigPathsGlob
    ? globSync(tsconfigPathsGlob, {
        cwd: repoRoot,
        exclude: (name) => name === "node_modules",
      })
        .map((p) => readJson(join(repoRoot, p))?.compilerOptions?.paths ?? {})
        .reduce((all, one) => Object.assign(all, one), {})
    : null

  let tree
  try {
    const args = ["list", "--depth", "Infinity", "--json"]
    tree = JSON.parse(
      run(
        manager,
        ...(isWorkspace && manager === "pnpm" ? [...args, "-r"] : args),
      ),
    )
  } catch (error) {
    return {
      checked: false,
      reason: `${manager} list failed: ${error.message}`,
      tsconfigPathsGlob,
      duplicates: [],
    }
  }

  const majors = new Map()
  const walk = (deps) => {
    for (const [name, node] of Object.entries(deps ?? {})) {
      if (node?.version) {
        majors.set(
          name,
          (majors.get(name) ?? new Set()).add(
            String(node.version).split(".")[0],
          ),
        )
      }
      walk(node?.dependencies)
    }
  }
  for (const ws of Array.isArray(tree) ? tree : [tree]) {
    walk(ws.dependencies)
    walk(ws.devDependencies)
  }

  const duplicates = [...majors]
    .filter(([, set]) => set.size > 1)
    .map(([name, set]) => ({
      name,
      majors: [...set].sort(),
      hoistedAtRoot:
        readJson(join(repoRoot, "node_modules", name, "package.json"))
          ?.version ?? null,
      pathsAt: paths ? (paths[name]?.[0] ?? null) : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { checked: true, reason: null, tsconfigPathsGlob, duplicates }
}

/** One normalized row shape out of either manager's `outdated --json`. */
function outdatedRows() {
  if (manager === "yarn" || manager === "bun") {
    return {
      rows: [],
      error: `${manager} is not supported by this scan — do the outdated pass by hand`,
    }
  }
  if (manager === "npm") {
    const raw = JSON.parse(
      run(
        "npm",
        "outdated",
        "--json",
        ...(isWorkspace ? ["-ws", "--include-workspace-root"] : []),
      ) || "{}",
    )
    const rows = []
    for (const [name, value] of Object.entries(raw)) {
      for (const info of [value].flat()) {
        rows.push({
          name,
          location: info.location
            ? resolve(info.location, "..", "..")
            : repoRoot,
          current: info.current ?? null,
          wanted: info.wanted ?? null,
          latest: info.latest ?? null,
        })
      }
    }
    return { rows, error: null }
  }
  const args = ["outdated", "--format=json", ...(isWorkspace ? ["-r"] : [])]
  const raw = JSON.parse(run("pnpm", ...args) || "{}")
  const rows = []
  for (const [name, info] of Object.entries(raw)) {
    const locations = (info.dependentPackages ?? []).map((p) => p.location)
    for (const location of locations.length > 0 ? locations : [repoRoot]) {
      rows.push({
        name,
        location,
        current: info.current ?? null,
        wanted: info.wanted ?? null,
        latest: info.latest ?? null,
      })
    }
  }
  return { rows, error: null }
}

const overrides = overriddenNames()
const manifests = new Map()
const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]
const { rows: raw, error: scanError } = outdatedRows()
const rows = []

for (const row of raw) {
  if (!manifests.has(row.location)) {
    manifests.set(
      row.location,
      readJson(join(row.location, "package.json")) ?? {},
    )
  }
  const manifest = manifests.get(row.location)
  const field = DEP_FIELDS.find((f) => manifest[f]?.[row.name])
  const declared = field ? manifest[field][row.name] : null
  const reason = outOfScopeReason(row.name, declared, overrides)
  rows.push({
    name: row.name,
    workspace: relative(repoRoot, row.location) || ".",
    dependencyType: field ?? null,
    current: row.current,
    wanted: row.wanted,
    latest: row.latest,
    declared,
    bump: bumpKind(row.current, row.latest),
    inScope: reason === null,
    outOfScopeReason: reason,
    ...(await resolveRepo(row.name, row.location)),
  })
}

rows.sort(
  (a, b) =>
    Number(b.inScope) - Number(a.inScope) || a.name.localeCompare(b.name),
)

console.log(
  JSON.stringify(
    {
      repoRoot,
      manager,
      isWorkspace,
      scanError,
      counts: {
        total: rows.length,
        inScope: rows.filter((r) => r.inScope).length,
        outOfScope: rows.filter((r) => !r.inScope).length,
        major: rows.filter((r) => r.inScope && r.bump === "major").length,
      },
      updates: rows,
      duplicateMajors: duplicateMajors(),
    },
    null,
    2,
  ),
)
