#!/usr/bin/env tsx
/**
 * Step 1 of manual extraction — fetches a postmortem URL, fills the
 * extraction prompt, and saves it to content/queue/.pending-extract.md.
 *
 * Usage: npm run ingest-prep -- <url>
 *
 * After running:
 *   1. Paste the contents of content/queue/.pending-extract.md into Claude Code
 *   2. Save the JSON output to a file (e.g. extracted.json)
 *   3. Run: npm run ingest-apply -- extracted.json
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INCIDENTS_DIR = resolve(ROOT, 'content/incidents')
const QUEUE_DIR     = resolve(ROOT, 'content/queue')
const PROMPTS_DIR   = resolve(ROOT, 'prompts')
const PENDING_FILE  = resolve(QUEUE_DIR, '.pending-extract.md')

const url = process.argv[2]
if (!url) {
  console.error('Usage: npm run ingest-prep -- <url>')
  process.exit(1)
}

// Check not already ingested
const alreadyIn = existsSync(INCIDENTS_DIR) &&
  readdirSync(INCIDENTS_DIR)
    .filter(f => f.endsWith('.md'))
    .some(f => String(matter(readFileSync(resolve(INCIDENTS_DIR, f), 'utf-8')).data.source ?? '') === url)

if (alreadyIn) {
  console.error(`Already in content/incidents/ — skipping.`)
  process.exit(0)
}

// Fetch page
console.log(`Fetching ${url} ...`)
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; onthejob-bot/1.0)',
    Accept: 'text/html,application/xhtml+xml',
  },
  signal: AbortSignal.timeout(20_000),
}).then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.text()
})

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80_000)
}

const pageText = extractText(html)
console.log(`  ${pageText.length} chars extracted`)

// Fill prompt template
const promptTemplate = readFileSync(resolve(PROMPTS_DIR, 'extract-incident.md'), 'utf-8')
const filled = promptTemplate
  .replace('{{SOURCE_URL}}', url)
  .replace('{{TEXT}}', pageText)

// Save
mkdirSync(QUEUE_DIR, { recursive: true })
writeFileSync(PENDING_FILE, filled)

console.log(`\nPrompt saved to content/queue/.pending-extract.md`)
console.log('\n' + '─'.repeat(60))
console.log('Next steps:')
console.log('  1. Paste the contents of .pending-extract.md into Claude Code')
console.log('  2. Ask: "Extract this postmortem and output only the JSON"')
console.log('  3. Save the JSON response to a file, e.g. extracted.json')
console.log('  4. Run: npm run ingest-apply -- extracted.json')
console.log('─'.repeat(60) + '\n')
