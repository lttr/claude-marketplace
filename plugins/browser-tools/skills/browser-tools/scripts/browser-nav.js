#!/usr/bin/env node

import puppeteer from "puppeteer-core"

const url = process.argv[2]
const newTab = process.argv[3] === "--new"

if (!url) {
  console.log("Usage: browser-nav.js <url> [--new]")
  console.log("\nExamples:")
  console.log(
    "  browser-nav.js https://example.com       # Navigate current tab",
  )
  console.log("  browser-nav.js https://example.com --new # Open in new tab")
  process.exit(1)
}

// Connect with retry logic in case Chrome just started
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
      console.error("  Make sure Chrome is running (use browser-start.js)")
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
}

if (newTab) {
  const p = await b.newPage()
  await p.goto(url, { waitUntil: "domcontentloaded" })
  console.log("✓ Opened:", url)
} else {
  const p = (await b.pages()).at(-1)
  await p.goto(url, { waitUntil: "domcontentloaded" })
  console.log("✓ Navigated to:", url)
}

await b.disconnect()
