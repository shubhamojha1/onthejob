#!/usr/bin/env tsx
/**
 * Scheduled ingestion worker — polls Statuspage-hosted status pages for
 * incidents that have a real postmortem writeup, dedupes against the repo,
 * and runs the shared ingest pipeline (extract → validate → ground → archive
 * → write → draft PR) per surviving incident.
 *
 * Stateless by design: dedup is derived entirely from the repo —
 *   1. content/incidents/*.md frontmatter `source` URLs (merged incidents)
 *   2. open draft PR bodies via `gh pr list` (in-flight incidents)
 *   3. content/queue/candidates.json (discovery-bot overlap)
 * Missed or repeated runs are harmless.
 *
 * Usage:  npm run statuspage-worker [-- --dry-run] [-- --max N]
 * Runs on the headless server via scripts/worker-cron.sh; LLM calls go through
 * `claude -p` (no ANTHROPIC_API_KEY needed).
 *
 * Sources: content/statuspage-sources.json
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  IngestError,
  ROOT,
  QUEUE_FILE,
  callLLM,
  checkBackend,
  checkGhCli,
  createDraftPr,
  detectBackend,
  extractIncident,
  extractText,
  fetchPageText,
  loadExistingSourceUrls,
  saveToArchive,
  validateIncident,
  writeIncidentFile,
} from './ingest-core.js'
import { verifyGrounding } from './grounding.js'
import type { Candidate } from './discovery.js'

const SOURCES_FILE = resolve(ROOT, 'content/statuspage-sources.json')

const DRY_RUN = process.argv.includes('--dry-run')
const maxArg  = process.argv.indexOf('--max')
const MAX_INGESTS = maxArg !== -1 ? Number(process.argv[maxArg + 1]) : 3

// Real-writeup filter: the public incidents.json payload has NO postmortem_body
// field (verified against GitHub/Discord/Cloudflare statuspages) — postmortems
// only render on the incident's HTML page. The reliable JSON-side signal is a
// long final update: investigating→resolved stubs are a few short updates,
// real writeups have a detailed resolution/root-cause update.
const MIN_WRITEUP_CHARS = 800

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatuspageSource {
  name: string
  api: string // .../api/v2/incidents.json
}

interface StatuspageIncident {
  id: string
  name: string
  status: string
  shortlink?: string
  created_at?: string
  resolved_at?: string
  impact?: string
  incident_updates?: Array<{ body?: string; status?: string; created_at?: string }>
  components?: Array<{ name?: string }>
}

interface StatuspageResponse {
  page: { name?: string; url?: string }
  incidents: StatuspageIncident[]
}

interface WorkItem {
  url: string
  title: string
  sourceName: string
  pageName: string
  sourceText: string
}

// ── Dedup (stateless — everything derived from the repo) ─────────────────────

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname}${u.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return url.toLowerCase().trim()
  }
}

function urlsInOpenPrs(): string[] {
  const res = spawnSync('gh', ['pr', 'list', '--state', 'open', '--json', 'body', '--limit', '100'], {
    cwd: ROOT,
    encoding: 'utf-8',
    shell: process.platform === 'win32',
  })
  if (res.status !== 0) {
    console.warn('  Warning: could not list open PRs — in-flight dedup disabled this run')
    return []
  }
  try {
    const prs = JSON.parse(res.stdout) as Array<{ body: string }>
    return prs.flatMap(pr => [...(pr.body ?? '').matchAll(/https?:\/\/[^\s)<>"]+/g)].map(m => m[0]))
  } catch {
    return []
  }
}

function buildSeenSet(): Set<string> {
  const seen = new Set<string>()
  for (const u of loadExistingSourceUrls()) if (u) seen.add(normalizeUrl(u))
  for (const u of urlsInOpenPrs()) seen.add(normalizeUrl(u))
  if (existsSync(QUEUE_FILE)) {
    const queue: Candidate[] = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
    for (const c of queue) if (c.status !== 'new') seen.add(normalizeUrl(c.url))
  }
  return seen
}

// ── Polling ───────────────────────────────────────────────────────────────────

/**
 * Real writeup vs investigating→resolved stub: resolved, significant impact,
 * and at least one detailed update. Minor/none-impact incidents are routine
 * blips that don't belong in a curated index even when verbosely written up.
 */
function hasRealWriteup(inc: StatuspageIncident): boolean {
  if (inc.status !== 'resolved' && inc.status !== 'postmortem') return false
  if (inc.impact !== 'critical' && inc.impact !== 'major') return false
  const longest = Math.max(0, ...(inc.incident_updates ?? []).map(u => (u.body ?? '').trim().length))
  return longest >= MIN_WRITEUP_CHARS
}

/**
 * Source text = API metadata header + all incident updates (chronological).
 * The header grounds date/timestamps against structured API fields — writeup
 * prose often omits the full date. At ingest time the incident's HTML page is
 * fetched too and appended (it carries the postmortem section when one was
 * published, which the JSON API does not expose).
 */
function buildSourceText(inc: StatuspageIncident, pageName: string): string {
  const components = (inc.components ?? []).map(c => c.name).filter(Boolean).join(', ')
  const header = [
    `Status page: ${pageName}`,
    `Incident: ${inc.name}`,
    `Impact level: ${inc.impact ?? 'unknown'}`,
    inc.created_at  ? `Started (created_at): ${inc.created_at}`    : '',
    inc.resolved_at ? `Resolved (resolved_at): ${inc.resolved_at}` : '',
    components      ? `Affected components: ${components}`          : '',
  ].filter(Boolean).join('\n')

  const updates = [...(inc.incident_updates ?? [])]
    .reverse() // API returns newest-first; read chronologically
    .map(u => `[${u.created_at ?? ''} ${u.status ?? ''}] ${extractText(u.body ?? '')}`)
    .join('\n')

  return `${header}\n\nINCIDENT UPDATES:\n${updates}`
}

async function pollSource(source: StatuspageSource, seen: Set<string>): Promise<WorkItem[]> {
  let data: StatuspageResponse
  try {
    const res = await fetch(source.api, {
      headers: { 'User-Agent': 'onthejob-statuspage-worker/1.0 (+https://onthejob.dev)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      console.warn(`  [${source.name}] HTTP ${res.status} — skipped`)
      return []
    }
    data = await res.json() as StatuspageResponse
  } catch (e) {
    console.warn(`  [${source.name}] ${e instanceof Error ? e.message : e} — skipped`)
    return []
  }

  const pageUrl  = (data.page?.url ?? source.api.replace(/\/api\/v2\/.*$/, '')).replace(/\/$/, '')
  const pageName = data.page?.name ?? source.name
  const items: WorkItem[] = []

  for (const inc of data.incidents ?? []) {
    if (!hasRealWriteup(inc)) continue
    const url = `${pageUrl}/incidents/${inc.id}`
    const dupe = seen.has(normalizeUrl(url))
      || (inc.shortlink ? seen.has(normalizeUrl(inc.shortlink)) : false)
    if (dupe) continue

    items.push({
      url,
      title: inc.name,
      sourceName: source.name,
      pageName,
      sourceText: buildSourceText(inc, pageName),
    })
    seen.add(normalizeUrl(url))
  }
  return items
}

// ── Per-incident pipeline ─────────────────────────────────────────────────────

async function ingestOne(item: WorkItem): Promise<void> {
  const backend = detectBackend()

  // The HTML page carries the published postmortem (absent from the JSON API)
  // — append it so extraction and grounding see the fullest source.
  let sourceText = item.sourceText
  try {
    const pageText = await fetchPageText(item.url)
    sourceText = `${item.sourceText}\n\nINCIDENT PAGE:\n${pageText}`.slice(0, 80_000)
  } catch {
    console.warn('  incident page fetch failed — using API text only')
  }

  console.log(`  extracting via ${backend} ...`)
  const { extracted, confidence } = await extractIncident(item.url, sourceText, backend)

  const incident = validateIncident(extracted, item.url)
  console.log(`  ✓ valid — id: ${incident.id}, confidence: ${confidence}`)

  const grounding = await verifyGrounding(incident, sourceText, p => callLLM(p, backend))
  for (const c of grounding.checks) {
    console.log(`    ${c.pass ? '✓' : '✗'} ${c.name.padEnd(22)} ${c.detail}`)
  }

  const archiveUrl = await saveToArchive(item.url)
  writeIncidentFile(incident, archiveUrl)

  const prUrl = createDraftPr(incident, confidence, item.url, grounding)
  console.log(`  ✓ PR: ${prUrl}${grounding.pass ? '' : '  (flagged grounding-failed)'}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`onthejob statuspage worker — ${new Date().toISOString()}${DRY_RUN ? ' (dry run)' : ''}\n`)

  if (!existsSync(SOURCES_FILE)) {
    console.error(`Missing ${SOURCES_FILE}`)
    process.exit(1)
  }
  const sources: StatuspageSource[] = JSON.parse(readFileSync(SOURCES_FILE, 'utf-8'))

  if (!DRY_RUN) {
    if (!checkBackend(detectBackend())) {
      console.error('No LLM backend: ANTHROPIC_API_KEY unset and `claude` CLI unavailable (or not logged in).')
      process.exit(2)
    }
    if (!checkGhCli()) {
      console.error('GitHub CLI (gh) not available — cannot open PRs.')
      process.exit(2)
    }
  }

  const seen = buildSeenSet()
  const work: WorkItem[] = []

  for (const source of sources) {
    process.stdout.write(`Poll  ${source.name.padEnd(28)}`)
    const items = await pollSource(source, seen)
    console.log(`+${items.length}`)
    work.push(...items)
  }

  if (work.length === 0) {
    console.log('\n✓ Nothing new.')
    return
  }

  const selected = work.slice(0, MAX_INGESTS)
  console.log(`\n${work.length} candidate(s), ingesting ${selected.length} (max ${MAX_INGESTS})${work.length > selected.length ? ' — rest picked up next run' : ''}\n`)

  if (DRY_RUN) {
    for (const item of selected) {
      console.log(`  would ingest: [${item.sourceName}] ${item.title}\n                ${item.url}  (${item.sourceText.length} chars)`)
    }
    return
  }

  let ok = 0, failed = 0
  for (const item of selected) {
    console.log(`→ [${item.sourceName}] ${item.title}\n  ${item.url}`)
    try {
      await ingestOne(item)
      ok++
    } catch (e) {
      failed++
      if (e instanceof IngestError) {
        console.error(`  ✗ [${e.stage}] ${e.message.split('\n')[0]}`)
      } else {
        console.error(`  ✗ ${e instanceof Error ? e.message : e}`)
      }
    }
    console.log()
  }

  console.log(`✓ Run complete — ${ok} PR(s) opened, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

main().catch(e => { console.error(e); process.exit(1) })
