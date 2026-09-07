#!/usr/bin/env node
// Page bridge: sink server + playwright-cli driver in one file. Node >= 24.
//
//   bridge.mjs serve            run the sink in the foreground; every event is
//                               one stdout line (this is what a Monitor runs)
//   bridge.mjs open <url>       open a headed browser whose every page carries
//                               the widget; survives reloads and navigation
//   bridge.mjs inject           install the widget into the page playwright-cli
//                               is already on; persists across reloads too
//   bridge.mjs status           is the sink up? is the widget installed?
//   bridge.mjs hide | show      toggle the widget (hide before a screenshot)
//   bridge.mjs log [n]          last n full event records from the JSONL
//   bridge.mjs stop             stop the sink
//
// Env: BRIDGE_PORT (default 7788), BRIDGE_DIR (default <os temp dir>/page-bridge),
//      BRIDGE_SESSION (playwright-cli session name; default: its default).
import { createServer } from "node:http"
import { appendFileSync, mkdirSync, readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { setTimeout as sleep } from "node:timers/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const PORT = Number(process.env.BRIDGE_PORT ?? 7788)
const DIR = process.env.BRIDGE_DIR ?? join(tmpdir(), "page-bridge")
const LOG = join(DIR, "events.jsonl")
const BASE = `http://localhost:${PORT}`
const WIDGET = `${import.meta.dirname}/bridge.js`

// The loader is all that goes into the page: a <script> tag pointing at the
// sink. The widget is re-fetched on every load, so editing bridge.js takes
// effect on the next reload with nothing to re-register.
const LOADER = `(() => {
  if (window.__bridge) return window.__bridge.show()
  const add = () => (document.head || document.documentElement).append(
    Object.assign(document.createElement("script"), { src: "${BASE}/bridge.js?" + Date.now() }))
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", add, { once: true }) : add()
})()`

// ------------------------------------------------------------------ helpers

const fail = (msg) => {
  console.error(msg)
  process.exit(1)
}

// Every browser interaction goes through playwright-cli. A missing binary is
// the one failure that must never be silent: say what is missing and how to
// install it, then exit. Any other failure (no browser open, eval threw)
// resolves to null and the caller decides.
const SESSION = process.env.BRIDGE_SESSION
const pw = (...args) => {
  try {
    return execFileSync(
      "playwright-cli",
      SESSION ? [`-s=${SESSION}`, ...args] : args,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim()
  } catch (err) {
    if (err.code === "ENOENT")
      fail(
        "playwright-cli is not on PATH. Install it with 'npm install -g @playwright/cli' (or your package manager's global install)",
      )
    return null
  }
}
// --raw prints the JSON-serialized value and nothing else.
const evalJs = (js) => {
  try {
    return JSON.parse(pw("--raw", "eval", js))
  } catch {
    return null
  }
}
// Register the loader as an init script on the whole context: it runs on every
// reload, navigation and new tab from now on. Runtime registration is why
// `inject` is persistent and needs no reopen.
const persist = () =>
  pw(
    "run-code",
    `async page => { await page.context().addInitScript(${JSON.stringify(LOADER)}) }`,
  ) !== null
const installed = () => evalJs("Boolean(window.__bridge)") === true
const href = () => evalJs("location.href") ?? "?"

const sinkUp = async () =>
  (await fetch(`${BASE}/health`).catch(() => null))?.ok ?? false
const requireSink = async () =>
  (await sinkUp()) ||
  fail(
    `sink is not running on :${PORT}. Start it with 'bridge.mjs serve' first`,
  )

// Poll rather than assume: the script tag loads asynchronously.
async function awaitWidget(tries = 20) {
  for (let i = 0; i < tries; i++) {
    if (installed()) return true
    await sleep(250)
  }
  return false
}

// One line per event, short enough to read in a notification. The full record
// lives in the log; this is the summary that wakes the agent up.
const trunc = (s, n) => {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
  return t.length > n ? `${t.slice(0, n)}…` : t
}
function summarize({ action, payload: p = {} }) {
  const at = `[${action}]`
  switch (action) {
    case "pick":
      return `${at} ${p.selector}${p.text ? `: "${trunc(p.text, 60)}"` : ""}`
    case "pick-multi":
      return `${at} ${p.items?.length ?? 0} elements: ${(p.items ?? []).map((i) => i.selector).join(" | ")}`
    case "annotate":
      return `${at} ${p.selector}: "${trunc(p.note, 120)}"`
    case "note":
      return `${at} ${trunc(p.note, 160)}`
    default:
      return `${at} ${trunc(JSON.stringify(p), 160)}`
  }
}

// --------------------------------------------------------------------- sink

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
}

function serve() {
  mkdirSync(DIR, { recursive: true })
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, BASE)
    const reply = (status, body, type = "text/plain") =>
      res
        .writeHead(status, {
          ...CORS,
          "content-type": `${type}; charset=utf-8`,
        })
        .end(body)

    if (req.method === "OPTIONS") return reply(204, "")
    if (pathname === "/health") return reply(200, "ok")
    if (pathname === "/bridge.js")
      return reply(200, readFileSync(WIDGET, "utf8"), "text/javascript")
    if (pathname === "/stop" && req.method === "POST") {
      reply(200, "bye")
      server.close()
      return process.exit(0)
    }
    if (pathname === "/event" && req.method === "POST") {
      let body = ""
      for await (const chunk of req) body += chunk
      let event
      try {
        event = JSON.parse(body)
      } catch {
        return reply(400, "bad json")
      }
      const record = { ts: new Date().toISOString(), ...event }
      appendFileSync(LOG, `${JSON.stringify(record)}\n`)
      console.log(summarize(record))
      return reply(200, "ok")
    }
    reply(404, "not found")
  })
  server.listen(PORT, "127.0.0.1", () =>
    console.error(`page-bridge listening on ${BASE}, log: ${LOG}`),
  )
}

// ----------------------------------------------------------------- commands

const commands = {
  serve,

  async open(url) {
    await requireSink()
    if (!url) fail("usage: bridge.mjs open <url>")
    if (pw("open", "--headed", url) === null)
      fail(
        "playwright-cli could not open a browser. Run the plugin's check.sh for the reason",
      )
    await commands.inject()
  },

  async inject() {
    await requireSink()
    if (href() === "?")
      fail(
        "no page open in playwright-cli. Run 'bridge.mjs open <url>' or 'playwright-cli open --headed <url>' first",
      )
    if (!persist())
      console.error(
        "warning: init script not registered, the widget will not survive a reload",
      )
    evalJs(LOADER)
    if (!(await awaitWidget()))
      fail(
        "widget did not install. Check the page console for CSP or network errors",
      )
    console.log(`widget installed (persistent) on ${href()}`)
  },

  async status() {
    console.log((await sinkUp()) ? `sink: up on :${PORT}` : "sink: down")
    let n = 0
    try {
      n = readFileSync(LOG, "utf8").split("\n").filter(Boolean).length
    } catch {}
    console.log(`log: ${LOG} (${n} events)`)
    const page = href()
    console.log(
      page === "?"
        ? "widget: no browser attached"
        : `widget: ${installed() ? "installed" : "NOT installed"} on ${page}`,
    )
  },

  hide: () =>
    console.log(
      evalJs(
        "window.__bridge ? (window.__bridge.hide(), 'hidden') : 'not installed'",
      ),
    ),
  show: () =>
    console.log(
      evalJs(
        "window.__bridge ? (window.__bridge.show(), 'shown') : 'not installed'",
      ),
    ),

  log(n = 5) {
    let lines = []
    try {
      lines = readFileSync(LOG, "utf8").split("\n").filter(Boolean)
    } catch {}
    console.log(
      lines.length ? lines.slice(-Number(n)).join("\n") : "no events yet",
    )
  },

  async stop() {
    const res = await fetch(`${BASE}/stop`, { method: "POST" }).catch(
      () => null,
    )
    console.log(res?.ok ? "stopped" : `nothing listening on :${PORT}`)
  },
}

const [cmd, ...args] = process.argv.slice(2)
if (!commands[cmd]) {
  const header = readFileSync(new URL(import.meta.url), "utf8")
    .split("\n")
    .slice(1)
  const usage = header.slice(
    0,
    header.findIndex((l) => !l.startsWith("//")),
  )
  console.error(usage.map((l) => l.replace(/^\/\/ ?/, "")).join("\n"))
  process.exit(1)
}
await commands[cmd](...args)
