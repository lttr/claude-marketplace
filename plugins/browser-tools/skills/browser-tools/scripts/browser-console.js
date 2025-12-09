#!/usr/bin/env node

import puppeteer from "puppeteer-core"

const args = process.argv.slice(2)
const noFollow = args.includes("--no-follow")
const levelIdx = args.indexOf("--level")
const levelFilter = levelIdx !== -1 ? args[levelIdx + 1]?.split(",") : null
const timeoutIdx = args.indexOf("--timeout")
const timeout = timeoutIdx !== -1 ? parseInt(args[timeoutIdx + 1]) : 2000

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: browser-console [options]")
  console.log("")
  console.log("Capture console logs from Chrome DevTools.")
  console.log("Streams by default - run in background and check output later.")
  console.log("")
  console.log("Options:")
  console.log("  --no-follow     Exit after timeout instead of streaming")
  console.log(
    "  --level LEVELS  Filter: log,warn,error,info,debug (comma-separated)",
  )
  console.log(
    "  --timeout MS    Duration in ms for --no-follow mode (default: 2000)",
  )
  console.log("")
  console.log("Note: Only captures logs from connection time onward.")
  console.log("      Start early to capture all relevant logs.")
  process.exit(0)
}

// Connect with retry logic
let b
for (let i = 0; i < 5; i++) {
  try {
    b = await puppeteer.connect({
      browserURL: "http://localhost:9222",
      defaultViewport: null,
    })
    break
  } catch (err) {
    if (i === 4) {
      console.error("✗ Failed to connect to Chrome on :9222")
      console.error("  Make sure Chrome is running (use browser-start)")
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
}

const p = (await b.pages()).at(-1)
if (!p) {
  console.error("✗ No active tab found")
  process.exit(1)
}

function formatTime(date) {
  return (
    date.toTimeString().slice(0, 8) +
    "." +
    String(date.getMilliseconds()).padStart(3, "0")
  )
}

// Normalize level names (puppeteer uses 'warning', users expect 'warn')
function normalizeLevel(type) {
  if (type === "warning") return "warn"
  return type
}

async function formatMessage(msg) {
  const time = formatTime(new Date())
  const type = normalizeLevel(msg.type())
  const typeUpper = type.toUpperCase()

  // Filter by level if specified
  if (levelFilter && !levelFilter.includes(type)) {
    return null
  }

  // Get message text
  const args = msg.args()
  let text

  if (args.length === 0) {
    text = msg.text()
  } else if (args.length === 1) {
    try {
      const val = await args[0].jsonValue()
      text =
        typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)
    } catch {
      text = msg.text()
    }
  } else {
    const parts = []
    for (const arg of args) {
      try {
        const val = await arg.jsonValue()
        parts.push(typeof val === "object" ? JSON.stringify(val) : String(val))
      } catch {
        parts.push(arg.toString())
      }
    }
    text = parts.join(" ")
  }

  // Handle multiline output
  if (text.includes("\n")) {
    const lines = text.split("\n")
    return (
      `[${time}] [${typeUpper}] ${lines[0]}\n` +
      lines
        .slice(1)
        .map((l) => "  " + l)
        .join("\n")
    )
  }

  return `[${time}] [${typeUpper}] ${text}`
}

// Get stack trace for errors
function formatStackTrace(msg) {
  const location = msg.location()
  if (location && location.url) {
    const line =
      location.lineNumber !== undefined ? `:${location.lineNumber}` : ""
    const col =
      location.columnNumber !== undefined ? `:${location.columnNumber}` : ""
    return `  at ${location.url}${line}${col}`
  }
  return null
}

// Set up console listener
p.on("console", async (msg) => {
  const formatted = await formatMessage(msg)
  if (formatted) {
    console.log(formatted)
    // Add stack trace for errors
    const type = normalizeLevel(msg.type())
    if (type === "error") {
      const stack = formatStackTrace(msg)
      if (stack) {
        console.log(stack)
      }
    }
  }
})

// Handle uncaught exceptions in the page
p.on("pageerror", (err) => {
  const time = formatTime(new Date())
  if (!levelFilter || levelFilter.includes("error")) {
    console.log(`[${time}] [PAGEERROR] ${err.message}`)
    if (err.stack) {
      const stackLines = err.stack.split("\n").slice(1)
      for (const line of stackLines) {
        console.log(`  ${line.trim()}`)
      }
    }
  }
})

if (noFollow) {
  // Snapshot mode - wait, then exit
  await new Promise((r) => setTimeout(r, timeout))
  await b.disconnect()
} else {
  // Streaming mode - handle Ctrl+C gracefully
  process.on("SIGINT", async () => {
    await b.disconnect()
    process.exit(0)
  })
  process.on("SIGTERM", async () => {
    await b.disconnect()
    process.exit(0)
  })
  console.error("Listening for console messages (Ctrl+C to stop)...")
  // Keep alive
  await new Promise(() => {})
}
