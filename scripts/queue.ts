#!/usr/bin/env tsx
/**
 * Print the discovery queue in a readable table.
 * Usage:
 *   npm run queue                       — show all 'new' candidates
 *   npm run queue -- --status done      — filter by status
 *   npm run queue -- --pick 8           — print full URL for entry #8
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Candidate } from './discovery.js'

const ROOT       = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CANDIDATES = resolve(ROOT, 'content/queue/candidates.json')

if (!existsSync(CANDIDATES)) {
  console.log('Queue is empty — run `npm run discover` first.')
  process.exit(0)
}

const all: Candidate[] = JSON.parse(readFileSync(CANDIDATES, 'utf-8'))

// --pick <n>: print the full URL for entry #n and exit
// npm eats --pick on some platforms, so also detect a bare number argument
const pickIdx = process.argv.indexOf('--pick')
const bareNum = process.argv.slice(2).find(a => /^\d+$/.test(a))
if (pickIdx !== -1 || bareNum) {
  const n = pickIdx !== -1
    ? parseInt(process.argv[pickIdx + 1], 10)
    : parseInt(bareNum!, 10)
  const items = all.filter(c => c.status === 'new')
  const item = items[n - 1]
  if (!item) { console.error(`No entry #${n} in the queue.`); process.exit(1) }
  console.log(item.url)
  process.exit(0)
}

const filterStatus = process.argv.includes('--status')
  ? process.argv[process.argv.indexOf('--status') + 1]
  : 'new'

const items = all.filter(c => c.status === filterStatus)

if (!items.length) {
  console.log(`No candidates with status "${filterStatus}".`)
  process.exit(0)
}

// Column widths
const W_IDX   = 4
const W_DATE  = 10
const W_SRC   = 26
const W_TITLE = 36
const W_URL   = 60

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n)
}

const hr = '─'.repeat(W_IDX + W_DATE + W_SRC + W_TITLE + W_URL + 10)

console.log(`\n  ${filterStatus.toUpperCase()} candidates (${items.length} of ${all.length} total)\n`)
console.log(`  ${'#'.padEnd(W_IDX)}  ${'Date'.padEnd(W_DATE)}  ${'Source'.padEnd(W_SRC)}  ${'Title'.padEnd(W_TITLE)}  ${'URL'.padEnd(W_URL)}`)
console.log(`  ${hr}`)

items.forEach((c, i) => {
  const idx   = String(i + 1).padEnd(W_IDX)
  const date  = trunc(c.date_found, W_DATE)
  const src   = trunc(c.source_feed, W_SRC)
  const title = trunc(c.discovered_title, W_TITLE)
  const url   = trunc(c.url, W_URL)
  console.log(`  ${idx}  ${date}  ${src}  ${title}  ${url}`)
})

console.log()
console.log(`  To extract a candidate: npm run ingest -- <url>`)
console.log()
