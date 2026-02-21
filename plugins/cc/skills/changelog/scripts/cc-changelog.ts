#!/usr/bin/env -S deno run --allow-run --allow-env --allow-read --allow-net
import $ from "jsr:@david/dax";

// --- Types ---

interface State {
  lastRun: string;
  lastVersion: string | null;
}

interface VersionEntry {
  version: string;
  date: string | null; // ISO date string (YYYY-MM-DD) from GitHub release
  changes: string[];
}

interface ScoredEntry {
  text: string;
  version: string;
  date: string | null;
  relevance: "high" | "medium" | "low";
  matches: string[];
}

interface UserContext {
  skills: string[];
  commands: string[];
  plugins: string[];
  hooks: string[];
  settings: string[];
}

interface Output {
  currentVersion: string;
  lastCheckedVersion: string | null;
  versions: VersionEntry[];
  systemPromptDiff: { prompt: string | null; flags: string | null };
  scored: ScoredEntry[];
  userContext: UserContext;
}

// --- Config ---

const STATE_PATH = `${Deno.env.get("HOME")}/.claude/cache/cc-changelog-state.json`;
const SKILLS_DIR = `${Deno.env.get("HOME")}/.claude/skills`;
const COMMANDS_DIR = `${Deno.env.get("HOME")}/.claude/commands`;
const SETTINGS_PATH = `${Deno.env.get("HOME")}/.claude/settings.json`;

const MEDIUM_KEYWORDS = [
  "agent",
  "permission",
  "performance",
  "startup",
  "compaction",
  "session",
  "plan mode",
  "plan preview",
  "linux",
  "hook",
  "skill",
  "plugin",
  "mcp",
  "command",
  "keybinding",
  "status",
  "thinking",
  "background",
  "teammate",
  "subagent",
  "memory",
  "spinner",
  "resume",
  "compact",
];

const SKIP_KEYWORDS = ["windows", "wsl", "vscode", "vs code", "sdk"];

// --- Helpers ---

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readState(): Promise<State> {
  const state = await readJson<State>(STATE_PATH);
  if (state) return state;
  // Default: 14-day window
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return { lastRun: d.toISOString().slice(0, 10), lastVersion: null };
}

function parseVersions(changelog: string): VersionEntry[] {
  const entries: VersionEntry[] = [];
  const lines = changelog.split("\n");
  let current: VersionEntry | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^## (\d+\.\d+\.\d+)/);
    if (headerMatch) {
      if (current) entries.push(current);
      current = { version: headerMatch[1], date: null, changes: [] };
      continue;
    }
    if (current && line.startsWith("- ")) {
      current.changes.push(line.slice(2).trim());
    }
  }
  if (current) entries.push(current);
  return entries;
}

/** Fetch release dates from GitHub and return a version -> date map */
async function fetchReleaseDates(): Promise<Map<string, string>> {
  const jq = '.[] | "\\(.tag_name) \\(.published_at)"';
  const output = await $`gh api repos/anthropics/claude-code/releases --paginate --jq ${jq}`
    .noThrow()
    .text();
  const map = new Map<string, string>();
  for (const line of output.trim().split("\n")) {
    if (!line.trim()) continue;
    const [tag, dateStr] = line.split(" ", 2);
    if (tag && dateStr) {
      const version = tag.replace(/^v/, "");
      map.set(version, dateStr.slice(0, 10)); // YYYY-MM-DD
    }
  }
  return map;
}

/** Attach release dates to parsed version entries */
function enrichWithDates(entries: VersionEntry[], dates: Map<string, string>): void {
  for (const entry of entries) {
    entry.date = dates.get(entry.version) ?? null;
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function filterVersionsInWindow(
  entries: VersionEntry[],
  lastVersion: string | null,
  currentVersion: string,
  lookbackDays?: number,
): VersionEntry[] {
  return entries.filter((e) => {
    const cmp = compareVersions(e.version, currentVersion);
    if (cmp > 0) return false; // future version

    if (!lastVersion) {
      // No previous version - use date-based lookback if dates are available
      const days = lookbackDays ?? 14;
      if (e.date) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return e.date >= cutoff.toISOString().slice(0, 10);
      }
      // No date info, fall back to showing just current
      return cmp >= 0;
    }

    // Show versions after lastVersion up to and including currentVersion
    return compareVersions(e.version, lastVersion) > 0 && cmp <= 0;
  });
}

// --- User context collection ---

async function collectSkills(): Promise<string[]> {
  const skills: string[] = [];
  try {
    for await (const entry of Deno.readDir(SKILLS_DIR)) {
      if (!entry.isDirectory) continue;
      try {
        const content = await Deno.readTextFile(`${SKILLS_DIR}/${entry.name}/SKILL.md`);
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        skills.push(nameMatch ? nameMatch[1].trim() : entry.name);
      } catch {
        skills.push(entry.name);
      }
    }
  } catch { /* dir doesn't exist */ }
  return skills;
}

async function collectCommands(): Promise<string[]> {
  const commands: string[] = [];
  try {
    for await (const entry of Deno.readDir(COMMANDS_DIR)) {
      const name = entry.name.replace(/\.md$/, "");
      commands.push(name);
    }
  } catch { /* dir doesn't exist */ }
  return commands;
}

interface Settings {
  enabledPlugins?: Record<string, boolean>;
  hooks?: Record<string, unknown>;
  [key: string]: unknown;
}

async function collectPlugins(): Promise<string[]> {
  const data = await readJson<Settings>(SETTINGS_PATH);
  if (!data?.enabledPlugins) return [];
  return Object.entries(data.enabledPlugins)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name.split("@")[0]);
}

async function collectSettings(): Promise<{ settings: string[]; hooks: string[] }> {
  const data = await readJson<Settings>(SETTINGS_PATH);
  if (!data) return { settings: [], hooks: [] };

  const settings: string[] = [];
  const hooks: string[] = [];

  // Extract boolean/string setting keys
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "boolean" || typeof val === "string") {
      settings.push(key);
    }
    if (key === "statusLine") settings.push("statusLine");
  }

  // Extract enabled plugin names
  if (data.enabledPlugins) {
    for (const [name, enabled] of Object.entries(data.enabledPlugins)) {
      if (enabled) settings.push(`plugin:${name.split("@")[0]}`);
    }
  }

  // Extract hook matchers (split pipe-separated matchers)
  if (data.hooks && typeof data.hooks === "object") {
    for (const [event, matchers] of Object.entries(data.hooks)) {
      hooks.push(event);
      if (Array.isArray(matchers)) {
        for (const m of matchers) {
          if (typeof m === "object" && m !== null && "matcher" in m) {
            const raw = String((m as { matcher: unknown }).matcher);
            for (const part of raw.split("|")) {
              hooks.push(part.trim());
            }
          }
        }
      }
    }
  }

  return { settings, hooks };
}

// --- Changelog fetching ---

async function fetchChangelog(): Promise<string> {
  const content = await $`gh api repos/anthropics/claude-code/contents/CHANGELOG.md --jq '.content'`
    .text();
  // Decode base64
  const decoded = atob(content.trim().replace(/\n/g, ""));
  return decoded;
}

// --- System prompt diff ---

async function fetchTags(): Promise<string[]> {
  const output = await $`gh api repos/marckrenn/claude-code-changelog/tags --paginate --jq '.[].name'`
    .noThrow()
    .text();
  return output.trim().split("\n").filter(Boolean);
}

function findNearestTag(tags: string[], version: string): string | null {
  // Tags are like v2.1.47
  const exact = `v${version}`;
  if (tags.includes(exact)) return exact;

  // Find closest lower version
  const versionTags = tags
    .filter((t) => t.startsWith("v"))
    .map((t) => ({ tag: t, ver: t.slice(1) }))
    .filter((t) => compareVersions(t.ver, version) <= 0)
    .sort((a, b) => compareVersions(b.ver, a.ver));

  return versionTags[0]?.tag ?? null;
}

async function fetchSystemPromptDiff(
  oldVersion: string | null,
  newVersion: string
): Promise<{ prompt: string | null; flags: string | null }> {
  const tags = await fetchTags();
  const newTag = findNearestTag(tags, newVersion);
  if (!newTag) return { prompt: null, flags: null };

  if (!oldVersion) {
    // No old version - just return null, can't diff
    return { prompt: null, flags: null };
  }

  const oldTag = findNearestTag(tags, oldVersion);
  if (!oldTag || oldTag === newTag) return { prompt: null, flags: null };

  try {
    const diffOutput =
      await $`gh api repos/marckrenn/claude-code-changelog/compare/${oldTag}...${newTag} --jq '.files[] | {filename, patch}'`
        .noThrow()
        .text();

    let prompt: string | null = null;
    let flags: string | null = null;

    // Parse JSONL-ish output (one JSON object per file)
    for (const line of diffOutput.trim().split("\n")) {
      if (!line.trim()) continue;
      try {
        const file = JSON.parse(line) as { filename: string; patch: string };
        if (file.filename.includes("prompt")) prompt = file.patch;
        if (file.filename.includes("flag")) flags = file.patch;
      } catch { /* skip unparseable lines */ }
    }

    return { prompt, flags };
  } catch {
    return { prompt: null, flags: null };
  }
}

// --- Relevance scoring ---

// Generic words that cause false positives when matched as substrings
const GENERIC_NAMES = new Set([
  "usage", "exit", "clear", "xxx", "start", "search", "test", "help",
]);

/** Check if keyword appears in text with word boundary awareness */
function keywordMatch(text: string, keyword: string): boolean {
  // For short keywords (< 6 chars), require word boundary to avoid substring false positives
  if (keyword.length < 6) {
    const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(text);
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function scoreEntry(
  text: string,
  version: string,
  date: string | null,
  userContext: UserContext
): ScoredEntry | null {
  const lower = text.toLowerCase();

  // Skip platform-irrelevant entries
  if (lower.startsWith("windows:") || lower.startsWith("vscode:")) {
    return { text, version, date, relevance: "low", matches: [] };
  }

  const matches: string[] = [];

  // Check against user's specific context (skills, commands, plugins, hooks, settings)
  const allUserKeywords = [
    ...userContext.skills,
    ...userContext.commands,
    ...userContext.plugins,
    ...userContext.hooks,
    ...userContext.settings,
  ];

  for (const keyword of allUserKeywords) {
    const kw = keyword.replace(/^plugin:/, "");
    if (kw.length >= 4 && keywordMatch(text, kw)) {
      matches.push(keyword);
    }
  }

  if (matches.length > 0) {
    return { text, version, date, relevance: "high", matches: [...new Set(matches)] };
  }

  // Check medium keywords (general workflow)
  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) {
      matches.push(kw);
    }
  }

  if (matches.length > 0) {
    return { text, version, date, relevance: "medium", matches: [...new Set(matches)] };
  }

  // Check skip keywords
  for (const kw of SKIP_KEYWORDS) {
    if (lower.includes(kw)) {
      return { text, version, date, relevance: "low", matches: [kw] };
    }
  }

  return { text, version, date, relevance: "low", matches: [] };
}

// --- CLI args ---

function parseLookbackDays(): number | undefined {
  for (const arg of Deno.args) {
    const match = arg.match(/^--lookback-days=(\d+)$/);
    if (match) return Number(match[1]);
  }
  return undefined;
}

// --- Main ---

async function main() {
  const lookbackDays = parseLookbackDays();
  const state = await readState();
  const currentVersion = (await $`claude --version`.text())
    .trim()
    .replace(/[^0-9.]/g, "")
    .replace(/^\.+|\.+$/g, "");

  // If lookback-days is specified, use date-based filtering (ignore lastVersion)
  const effectiveLastVersion = lookbackDays !== undefined ? null : state.lastVersion;

  // Fetch changelog, releases, and parse
  const [changelog, releaseDates] = await Promise.all([
    fetchChangelog(),
    fetchReleaseDates(),
  ]);
  const allVersions = parseVersions(changelog);
  enrichWithDates(allVersions, releaseDates);
  const versions = filterVersionsInWindow(allVersions, effectiveLastVersion, currentVersion, lookbackDays);

  // Fetch system prompt diff - use oldest version in window as baseline when lastVersion is null
  const oldestInWindow = versions.length > 0
    ? versions[versions.length - 1].version
    : effectiveLastVersion;
  const systemPromptDiff = await fetchSystemPromptDiff(oldestInWindow, currentVersion);

  // Collect user context
  const [skills, commands, plugins, { settings, hooks }] = await Promise.all([
    collectSkills(),
    collectCommands(),
    collectPlugins(),
    collectSettings(),
  ]);

  const userContext: UserContext = { skills, commands, plugins, hooks, settings };

  // Score all changelog entries in window
  const scored: ScoredEntry[] = [];
  for (const ver of versions) {
    for (const change of ver.changes) {
      const entry = scoreEntry(change, ver.version, ver.date, userContext);
      if (entry) scored.push(entry);
    }
  }

  // Sort: high first, then medium, then low
  const order = { high: 0, medium: 1, low: 2 };
  scored.sort((a, b) => order[a.relevance] - order[b.relevance]);

  // Output
  const output: Output = {
    currentVersion,
    lastCheckedVersion: state.lastVersion,
    versions,
    systemPromptDiff,
    scored,
    userContext,
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
