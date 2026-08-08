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

import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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
  markQueueDone,
  markQueueRejected,
  run,
  saveToArchive,
  validateIncident,
  writeIncidentFile,
} from './ingest-core.js'
import { verifyGrounding } from './grounding.js'
import type { Candidate } from './discovery.js'
import {
  applyQueueStatusUpdates,
  deriveQueueStatusUpdates,
  mergeQueueStatusUpdates,
  type QueueStatusUpdate,
} from './lib/queue-status.js'

const SOURCES_FILE = resolve(ROOT, 'content/statuspage-sources.json')
const PENDING_QUEUE_STATUS_FILE = resolve(homedir(), '.systemsfailed-pending-queue-status.json')

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
  fromQueue?: boolean
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
      headers: { 'User-Agent': 'systemsfailed-statuspage-worker/1.0 (+https://systemsfailed.dev)' },
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

/**
 * Discovery queue (content/queue/candidates.json) — filled daily by
 * `npm run discover` from postmortem collections and engineering-blog RSS
 * feeds (danluu/post-mortems, Netflix, Stripe, AWS, etc.). Nothing previously
 * turned those candidates into PRs automatically; this treats the queue as
 * one more rotating source alongside the statuspages so non-statuspage
 * incidents get picked up too, instead of sitting there until someone runs
 * `npm run ingest` by hand.
 */
function pollQueue(seen: Set<string>): WorkItem[] {
  if (!existsSync(QUEUE_FILE)) return []
  const queue: Candidate[] = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  const items: WorkItem[] = []

  for (const c of queue) {
    if (c.status !== 'new') continue
    const norm = normalizeUrl(c.url)
    if (seen.has(norm)) continue

    items.push({
      url: c.url,
      title: c.discovered_title,
      sourceName: c.source_feed,
      pageName: c.source_feed,
      sourceText: '',
      fromQueue: true,
    })
    seen.add(norm)
  }
  return items
}

/**
 * markQueueDone/markQueueRejected write content/queue/candidates.json straight
 * to disk — nothing else in this run's git flow (which only commits incident
 * branches) ever persists that. Replay this run's status transitions onto the
 * latest remote queue before pushing, so discovery.yml can add candidates at
 * the same time without either writer discarding the other's work.
 */
function commitQueueStatus(): boolean {
  const status = spawnSync('git', ['status', '--porcelain', '--', 'content/queue/candidates.json'], {
    cwd: ROOT,
    encoding: 'utf-8',
  })

  const queuePath = 'content/queue/candidates.json'
  let currentUpdates: QueueStatusUpdate[] = []
  if (status.stdout.trim()) {
    const before = JSON.parse(run('git', ['show', `HEAD:${queuePath}`], { quiet: true })) as Candidate[]
    const after = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8')) as Candidate[]
    currentUpdates = deriveQueueStatusUpdates(before, after)
  }

  let persistedUpdates: QueueStatusUpdate[] = []
  if (existsSync(PENDING_QUEUE_STATUS_FILE)) {
    try {
      persistedUpdates = JSON.parse(readFileSync(PENDING_QUEUE_STATUS_FILE, 'utf-8')) as QueueStatusUpdate[]
    } catch {
      console.warn(`  ✗ discarded unreadable pending queue status file: ${PENDING_QUEUE_STATUS_FILE}`)
      try { unlinkSync(PENDING_QUEUE_STATUS_FILE) } catch {}
    }
  }

  const updates = mergeQueueStatusUpdates(persistedUpdates, currentUpdates)
  if (updates.length === 0) return true

  const pendingTemp = `${PENDING_QUEUE_STATUS_FILE}.tmp`
  try {
    writeFileSync(pendingTemp, JSON.stringify(updates, null, 2) + '\n')
    renameSync(pendingTemp, PENDING_QUEUE_STATUS_FILE)
  } catch (error) {
    try { unlinkSync(pendingTemp) } catch {}
    try {
      run('git', ['restore', '--source=HEAD', '--staged', '--worktree', queuePath], { quiet: true })
    } catch {}
    console.warn(`  ✗ could not persist queue status for retry: ${error instanceof Error ? error.message : error}`)
    return false
  }

  // Replay only this run's transitions over the newest remote queue. This
  // preserves candidates added concurrently by discovery.yml and prevents a
  // rejected push from leaving main ahead or the working tree dirty.
  run('git', ['restore', '--source=HEAD', '--staged', '--worktree', queuePath], { quiet: true })
  console.log('Committing discovery queue status updates ...')

  for (let attempt = 1; attempt <= 3; attempt++) {
    let commitCreated = false
    try {
      run('git', ['fetch', 'origin', 'main'], { quiet: true })
      run('git', ['merge', '--ff-only', 'origin/main'], { quiet: true })

      const latest = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8')) as Candidate[]
      const merged = applyQueueStatusUpdates(latest, updates)
      writeFileSync(QUEUE_FILE, JSON.stringify(merged, null, 2) + '\n')

      const changed = spawnSync('git', ['status', '--porcelain', '--', queuePath], {
        cwd: ROOT,
        encoding: 'utf-8',
      }).stdout.trim()
      if (!changed) {
        try { unlinkSync(PENDING_QUEUE_STATUS_FILE) } catch {}
        console.log('  ✓ already current\n')
        return !existsSync(PENDING_QUEUE_STATUS_FILE)
      }

      run('git', ['add', queuePath])
      run('git', ['commit', '-m', 'chore: update discovery queue status [skip ci]'])
      commitCreated = true
      run('git', ['push', 'origin', 'main'])
      try { unlinkSync(PENDING_QUEUE_STATUS_FILE) } catch {}
      console.log('  ✓ pushed\n')
      return !existsSync(PENDING_QUEUE_STATUS_FILE)
    } catch (error) {
      // A discovery commit may have landed after fetch. Remove only the
      // queue-status commit just created, clean that file, and retry.
      if (commitCreated) {
        try { run('git', ['reset', '--mixed', 'HEAD^'], { quiet: true }) } catch {}
      }
      try {
        run('git', ['restore', '--source=HEAD', '--staged', '--worktree', queuePath], { quiet: true })
      } catch {}
      console.warn(`  ✗ queue sync attempt ${attempt}/3 failed: ${error instanceof Error ? error.message : error}`)
      if (attempt === 3) {
        console.warn(`  queue status deferred in ${PENDING_QUEUE_STATUS_FILE}; checkout left clean\n`)
        return false
      }
    }
  }

  return false
}

interface QueueRecoveryOptions {
  dryRun: boolean
  hasPending: () => boolean
  sync: () => boolean
}

/**
 * Reconcile a status update left by an earlier failed push before the queue is
 * read. Otherwise a remote `new` row can be selected again, or a deduped `done`
 * row can make the worker return without ever replaying the saved transition.
 */
export async function withQueueRecoveryBeforePolling<T>(
  poll: () => T | Promise<T>,
  options: QueueRecoveryOptions = {
    dryRun: DRY_RUN,
    hasPending: () => existsSync(PENDING_QUEUE_STATUS_FILE),
    sync: commitQueueStatus,
  },
): Promise<T> {
  if (!options.dryRun && options.hasPending()) {
    const recovered = options.sync()
    if (!recovered || options.hasPending()) {
      throw new Error('Pending queue status could not be synchronized; deferring ingestion')
    }
  }
  return await poll()
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
  } catch (e) {
    // Statuspage items still have their structured API text to fall back on;
    // queue items (sourceText === '') have nothing else to extract from.
    if (!item.sourceText) {
      throw new IngestError('fetch', `page fetch failed and no fallback source text: ${e instanceof Error ? e.message : e}`)
    }
    console.warn('  incident page fetch failed — using API text only')
  }

  console.log(`  extracting via ${backend} ...`)
  const { extracted, confidence, tweet } = await extractIncident(item.url, sourceText, backend)

  const incident = validateIncident(extracted, item.url)
  console.log(`  ✓ valid — id: ${incident.id}, confidence: ${confidence}`)

  const grounding = await verifyGrounding(incident, sourceText, p => callLLM(p, backend))
  for (const c of grounding.checks) {
    console.log(`    ${c.pass ? '✓' : '✗'} ${c.name.padEnd(22)} ${c.detail}`)
  }

  const archiveUrl = await saveToArchive(item.url)
  writeIncidentFile(incident, archiveUrl)

  const prUrl = createDraftPr(incident, confidence, item.url, grounding, tweet)
  console.log(`  ✓ PR: ${prUrl}${grounding.pass ? '' : '  (flagged grounding-failed)'}`)

  markQueueDone(item.url) // no-op if item.url isn't a queue candidate
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`systemsfailed statuspage worker — ${new Date().toISOString()}${DRY_RUN ? ' (dry run)' : ''}\n`)

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

  const bySource = await withQueueRecoveryBeforePolling(async () => {
    const seen = buildSeenSet()
    const polled: WorkItem[][] = []

    for (const source of sources) {
      process.stdout.write(`Poll  ${source.name.padEnd(28)}`)
      const items = await pollSource(source, seen)
      console.log(`+${items.length}`)
      polled.push(items)
    }

    process.stdout.write(`Poll  ${'queue (discovery bot)'.padEnd(28)}`)
    const queueItems = pollQueue(seen)
    console.log(`+${queueItems.length}`)
    polled.push(queueItems)
    return polled
  })

  const work = bySource.flat()
  if (work.length === 0) {
    console.log('\n✓ Nothing new.')
    return
  }

  // Round-robin across sources so one source's backlog (e.g. a status page
  // that writes long detailed updates) can't monopolize the per-run quota
  // and starve every other source indefinitely.
  const selected: WorkItem[] = []
  for (let round = 0; selected.length < MAX_INGESTS && round < Math.max(...bySource.map(s => s.length)); round++) {
    for (const items of bySource) {
      if (selected.length >= MAX_INGESTS) break
      if (items[round]) selected.push(items[round])
    }
  }
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
      // Queue candidates have nowhere else to dedup from (no PR/incident file
      // gets created on failure) — leaving them `new` means the exact same
      // failure (bad extraction, already-covered incident, ...) gets retried
      // and re-burns an LLM call every run, forever.
      if (item.fromQueue) {
        markQueueRejected(item.url)
        console.error(`  → marked rejected in queue (won't retry)`)
      }
    }
    console.log()
  }

  console.log(`✓ Run complete — ${ok} PR(s) opened, ${failed} failed.`)
  commitQueueStatus()
  if (failed > 0) process.exitCode = 1
}

const isDirectRun = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false

if (isDirectRun) {
  main().catch(e => { console.error(e); process.exit(1) })
}
