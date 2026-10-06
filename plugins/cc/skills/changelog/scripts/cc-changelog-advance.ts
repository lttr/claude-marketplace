#!/usr/bin/env -S deno run --allow-run --allow-env --allow-read --allow-write
import $ from "jsr:@david/dax"

const CONFIG_DIR =
  Deno.env.get("CLAUDE_CONFIG_DIR") ??
  `${Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE")}/.claude`
const STATE_PATH = `${CONFIG_DIR}/custom-cache/cc-changelog-state.json`

const currentVersion = (await $`claude --version`.text())
  .trim()
  .replace(/[^0-9.]/g, "")
  .replace(/^\.+|\.+$/g, "")

const state = {
  lastRun: new Date().toISOString().slice(0, 10),
  lastVersion: currentVersion,
}
await Deno.mkdir(`${CONFIG_DIR}/custom-cache`, {
  recursive: true,
})
await Deno.writeTextFile(STATE_PATH, JSON.stringify(state, null, 2) + "\n")

console.log(JSON.stringify({ advanced: true, version: currentVersion }))
