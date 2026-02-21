#!/usr/bin/env -S deno run --allow-run --allow-env --allow-read --allow-write
import $ from "jsr:@david/dax"

const STATE_PATH = `${Deno.env.get("HOME")}/.claude/cache/cc-changelog-state.json`

const currentVersion = (await $`claude --version`.text())
  .trim()
  .replace(/[^0-9.]/g, "")
  .replace(/^\.+|\.+$/g, "")

const state = {
  lastRun: new Date().toISOString().slice(0, 10),
  lastVersion: currentVersion,
}
await Deno.mkdir(`${Deno.env.get("HOME")}/.claude/cache`, { recursive: true })
await Deno.writeTextFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n")

console.log(JSON.stringify({ advanced: true, version: currentVersion }))
