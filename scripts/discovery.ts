#!/usr/bin/env tsx
/**
 * Discovery bot — polls sources for candidate engineering postmortems and
 * appends new entries to content/queue/candidates.json.
 *
 * Never writes to content/incidents/. The GitHub Action commits only content/queue/.
 *
 * Run manually: npm run discover
 * Backfill:     npm run discover:backfill:dry
 * Env:          GITHUB_TOKEN (strongly recommended; raises rate limit to 5000 req/hr)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import Parser from 'rss-parser'

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT       = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const QUEUE_DIR  = resolve(ROOT, 'content/queue')
const CANDIDATES = resolve(QUEUE_DIR, 'candidates.json')
const STATE_FILE = resolve(QUEUE_DIR, 'state.json')
const INCIDENTS  = resolve(ROOT, 'content/incidents')

// ── Config ────────────────────────────────────────────────────────────────────

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? ''

const KEYWORDS = [
  'outage', 'incident', 'postmortem', 'post-mortem',
  'rca', 'root cause', 'degradation', 'service disruption',
]

const AI_SYSTEM_KEYWORDS = [
  'ai', 'model', 'llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'copilot',
  'recommendation', 'ranking', 'retrieval', 'inference', 'image generation',
]

const AI_FAILURE_KEYWORDS = [
  'rollback', 'rolled back', 'wrong', 'incorrect', 'unsafe', 'harmful',
  'sycophan', 'unexpected behavior', 'quality issue', 'what happened',
  'what we missed', 'failed', 'failure', 'bug', 'outage', 'postmortem',
  'post-mortem', 'root cause', 'degradation', 'service disruption',
  'data exposure', 'exposed other users',
]

const AI_PRODUCTION_KEYWORDS = [
  'production', 'deployed', 'deployment', 'rollout',
  'live', 'user', 'users', 'customer', 'customers',
  'traffic', 'request', 'requests', 'response', 'responses', 'service',
  'app', 'product',
]

/**
 * Hosts that never carry a first-party postmortem — encyclopaedias, social
 * posts, and journalism *about* an outage.
 *
 * These are more expensive than a source that fails outright: a news article
 * describing an outage extracts into a plausible-looking incident, so the
 * worker opens a PR and someone has to read it to find out it isn't one.
 * Curated lists cite them freely for incidents with no operator writeup.
 *
 * Matched on the host and its subdomains, so entries must be specific enough
 * not to swallow a real source — `amazon.com` would take `aws.amazon.com`
 * with it, which is three incidents in the archive.
 */
const HOST_DENYLIST = [
  'wikipedia.org', 'wikimedia.org',
  'twitter.com', 'x.com', 'reddit.com', 'news.ycombinator.com',
  'linkedin.com', 'facebook.com', 'youtube.com', 'youtu.be',
  'nytimes.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com',
  'reuters.com', 'bbc.com', 'bbc.co.uk', 'theguardian.com', 'cnn.com',
  'wired.com', 'arstechnica.com', 'theregister.com', 'zdnet.com',
  'cnet.com', 'techcrunch.com', 'forbes.com', 'businessinsider.com',
]

const GITHUB_SOURCES = [
  // hjacobs/kubernetes-failure-stories moved to codeberg.org and the GitHub
  // README is now a one-line redirect stub — dropped rather than left polling
  // a dead source. Re-adding it means teaching the poller a non-GitHub host.
  { repo: 'danluu/post-mortems',   path: 'README.md', name: 'danluu/post-mortems' },
  { repo: 'lorin/major-incidents', path: 'README.md', name: 'lorin/major-incidents' },
]

const RSS_FEEDS: Array<{ url: string; name: string; filter?: 'ai-incident' }> = [
  // Official operator feeds broaden discovery beyond conventional outages.
  // The paired AI keyword rule keeps ordinary product launches out of queue.
  { url: 'https://openai.com/news/rss.xml',             name: 'openai-news', filter: 'ai-incident' },
  { url: 'https://deepmind.google/blog/rss.xml',        name: 'google-deepmind', filter: 'ai-incident' },
  { url: 'https://blog.google/rss/',                    name: 'google-blog', filter: 'ai-incident' },
  { url: 'https://blog.cloudflare.com/rss/',             name: 'cloudflare-blog' },
  { url: 'https://slack.engineering/feed/',              name: 'slack-engineering' },
  { url: 'https://github.blog/engineering/feed/',        name: 'github-engineering' },
  { url: 'https://netflixtechblog.com/feed',             name: 'netflix-tech-blog' },
  { url: 'https://stripe.com/blog/engineering/rss',      name: 'stripe-engineering' },
  { url: 'https://aws.amazon.com/blogs/aws/feed/',       name: 'aws-blog' },
  { url: 'https://discord.com/blog/rss',                 name: 'discord-blog' },
  { url: 'https://www.canva.dev/blog/engineering/feed/', name: 'canva-engineering' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Candidate {
  url: string
  discovered_title: string
  source_feed: string
  date_found: string
  status: 'review' | 'new' | 'done' | 'rejected'
}

interface State {
  last_commit_date: Record<string, string>
  last_feed_date:   Record<string, string>
  last_pr_number:   Record<string, number>
}

// ── I/O ───────────────────────────────────────────────────────────────────────

function loadState(): State {
  const empty: State = { last_commit_date: {}, last_feed_date: {}, last_pr_number: {} }
  return existsSync(STATE_FILE)
    ? { ...empty, ...JSON.parse(readFileSync(STATE_FILE, 'utf-8')) }
    : empty
}

function saveState(s: State): void {
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2) + '\n')
}

function loadCandidates(): Candidate[] {
  return existsSync(CANDIDATES) ? JSON.parse(readFileSync(CANDIDATES, 'utf-8')) : []
}

function saveCandidates(c: Candidate[]): void {
  mkdirSync(QUEUE_DIR, { recursive: true })
  writeFileSync(CANDIDATES, JSON.stringify(c, null, 2) + '\n')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname}${u.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return url.toLowerCase().trim()
  }
}

/**
 * A wayback link wraps a real URL whose host still decides the question.
 * Used only for the denylist check — the archived URL is what gets stored and
 * fetched, since the original is usually dead (that's why it was archived).
 */
function unwrapArchive(url: string): string {
  const m = url.match(/^https?:\/\/web\.archive\.org\/web\/[^/]+\/(https?:\/\/.+)$/)
  return m ? m[1] : url
}

/** True when a candidate URL can't be a postmortem worth an extraction call. */
function isDenied(url: string): boolean {
  let u: URL
  try {
    u = new URL(unwrapArchive(url))
  } catch {
    return true // unparseable — nothing downstream can fetch it
  }
  // No extension rule: `.pdf` looks like an easy win until you notice the
  // Knight Capital incident is sourced from an SEC administrative filing.
  // Primary documents are exactly what this archive wants.
  const host = u.hostname.replace(/^www\./, '')
  return HOST_DENYLIST.some(d => host === d || host.endsWith(`.${d}`))
}

/**
 * Flag denied candidates as `rejected` rather than dropping them.
 *
 * `pollQueue` only picks up `new`, so rejecting is enough to keep them out of
 * PRs, and it keeps them visible under `npm run queue -- --status rejected`.
 * Dropping would also mean the backfill path re-harvests the same junk from the
 * README on every run, since the seen-set is rebuilt from the file.
 *
 * Applied to the existing queue too — entries predating the gate are just as
 * reachable by the worker as new ones.
 */
function gate(candidates: Candidate[]) {
  let blocked = 0
  const out = candidates.map(c => {
    if ((c.status !== 'new' && c.status !== 'review') || !isDenied(c.url)) return c
    blocked++
    return { ...c, status: 'rejected' as const }
  })
  return { candidates: out, blocked }
}

function previewBackfill(candidates: Candidate[]) {
  const { candidates: gated, blocked } = gate(candidates)
  return {
    accepted: gated.filter(candidate => candidate.status === 'new'),
    blocked,
  }
}

function stageBackfillForReview(candidates: Candidate[], backfillUrls: Set<string>): Candidate[] {
  return candidates.map(candidate =>
    candidate.status === 'new' && backfillUrls.has(candidate.url)
      ? { ...candidate, status: 'review' as const }
      : candidate,
  )
}

function hasAiFailureKeyword(text: string): boolean {
  const lo = text.toLowerCase()
  const hasBoundedTerm = (keyword: string) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(lo)
  }
  const hasSystemTerm = AI_SYSTEM_KEYWORDS.some(hasBoundedTerm)
  const hasProductionTerm = AI_PRODUCTION_KEYWORDS.some(hasBoundedTerm)
  return hasSystemTerm
    && hasProductionTerm
    && AI_FAILURE_KEYWORDS.some(hasBoundedTerm)
}

function hasKeyword(text: string): boolean {
  const lo = text.toLowerCase()
  return KEYWORDS.some(keyword => lo.includes(keyword))
}

function extractLinks(text: string): Array<{ url: string; title: string }> {
  return [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)]
    .map(m => ({ title: m[1].trim(), url: m[2].trim() }))
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

/** Normalized `source:` URL of every incident already in the archive. */
function ingestedSources(): Set<string> {
  const urls = new Set<string>()
  if (!existsSync(INCIDENTS)) return urls
  for (const f of readdirSync(INCIDENTS)) {
    if (!f.endsWith('.md')) continue
    const { data } = matter(readFileSync(resolve(INCIDENTS, f), 'utf-8'))
    if (data.source) urls.add(normalizeUrl(String(data.source)))
  }
  return urls
}

/** Seed the dedup set from existing committed incidents and the current queue. */
function buildSeenSet(existing: Candidate[], ingested: Set<string>): Set<string> {
  const seen = new Set(ingested)
  for (const c of existing) seen.add(normalizeUrl(c.url))
  return seen
}

/**
 * A candidate is done once its URL is a live incident source, whichever path
 * ingested it. `ingest-apply` writes that status itself, but a manual ingest
 * or a URL that changed shape in the frontmatter leaves the queue claiming
 * work that no longer exists.
 */
function reconcile(existing: Candidate[], ingested: Set<string>) {
  let healed = 0
  const candidates = existing.map(c => {
    if (c.status === 'done' || !ingested.has(normalizeUrl(c.url))) return c
    healed++
    return { ...c, status: 'done' as const }
  })
  return { candidates, healed }
}

async function ghFetch(url: string, accept = 'application/vnd.github.v3+json'): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: accept,
      'User-Agent': 'systemsfailed-discovery-bot',
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  })
}

// ── Source: GitHub commits (diff-based — only genuinely new links surface) ────

async function pollGitHubCommits(
  { repo, path, name }: typeof GITHUB_SOURCES[number],
  state: State,
  seen: Set<string>,
): Promise<Candidate[]> {
  // First run: look back 90 days. Subsequent runs: since last run.
  const since = state.last_commit_date[name]
    ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const res = await ghFetch(
    `https://api.github.com/repos/${repo}/commits?path=${encodeURIComponent(path)}&since=${since}&per_page=30`,
  )
  if (!res.ok) {
    console.warn(`  [${name}] commits ${res.status} — skipped`)
    return []
  }

  const commits = await res.json() as Array<{ sha: string }>
  if (!commits.length) {
    process.stdout.write('no new commits ')
    return []
  }

  const candidates: Candidate[] = []

  for (const { sha } of commits) {
    const diffRes = await ghFetch(
      `https://api.github.com/repos/${repo}/commits/${sha}`,
      'application/vnd.github.v3.diff',
    )
    if (!diffRes.ok) continue

    const diff = await diffRes.text()

    // Isolate the diff section for our target file only
    const section = diff.split(/^diff --git /m).find(s => s.includes(`b/${path}`)) ?? ''

    const addedLines = section
      .split('\n')
      .filter(l => l.startsWith('+') && !l.startsWith('+++'))

    for (const line of addedLines) {
      for (const { url, title } of extractLinks(line)) {
        const norm = normalizeUrl(url)
        if (seen.has(norm) || title.length < 4) continue
        candidates.push({ url, discovered_title: title, source_feed: name, date_found: today(), status: 'new' })
        seen.add(norm)
      }
    }

    await delay(250) // stay well within GitHub rate limits
  }

  state.last_commit_date[name] = new Date().toISOString()
  return candidates
}

/**
 * One-time harvest of a curated list's *existing* contents.
 *
 * The commit poller only sees lines added since it started running, so the
 * backlog these READMEs accumulated before then is invisible to it. These are
 * hand-curated postmortem lists, so external links are candidates without a
 * keyword filter. The normal source-quality gate still applies.
 */
async function backfillReadme(
  { repo, path, name }: typeof GITHUB_SOURCES[number],
  seen: Set<string>,
): Promise<Candidate[]> {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/${path}`, {
    headers: { 'User-Agent': 'systemsfailed-discovery-bot' },
  })
  if (!res.ok) {
    console.warn(`  [${name}] readme ${res.status} — skipped`)
    return []
  }

  return extractBackfillCandidates(await res.text(), { repo, name }, seen)
}

/** Parse a curated README without treating links back to the list itself as incidents. */
function extractBackfillCandidates(
  markdown: string,
  source: { repo: string; name: string },
  seen: Set<string>,
  dateFound = today(),
): Candidate[] {
  const candidates: Candidate[] = []
  const sourcePrefix = `github.com/${source.repo.toLowerCase()}`
  for (const { url, title } of extractLinks(markdown)) {
    const norm = normalizeUrl(url)
    if (seen.has(norm) || title.length < 4 || norm.startsWith(sourcePrefix)) continue
    candidates.push({
      url,
      discovered_title: title,
      source_feed: `${source.name}/backfill`,
      date_found: dateFound,
      status: 'new',
    })
    seen.add(norm)
  }
  return candidates
}

// ── Source: GitHub open PRs ───────────────────────────────────────────────────

async function pollGitHubPRs(
  repo: string,
  name: string,
  state: State,
  seen: Set<string>,
): Promise<Candidate[]> {
  const lastPR = state.last_pr_number[name] ?? 0

  const res = await ghFetch(
    `https://api.github.com/repos/${repo}/pulls?state=open&per_page=30&sort=created&direction=desc`,
  )
  if (!res.ok) {
    console.warn(`  [${name} PRs] ${res.status} — skipped`)
    return []
  }

  const prs = await res.json() as Array<{ number: number; title: string; body: string | null }>
  const candidates: Candidate[] = []
  let maxPR = lastPR

  for (const pr of prs) {
    maxPR = Math.max(maxPR, pr.number)
    if (pr.number <= lastPR) continue
    for (const { url, title } of extractLinks(pr.body ?? '')) {
      const norm = normalizeUrl(url)
      if (seen.has(norm)) continue
      candidates.push({
        url,
        discovered_title: title || pr.title,
        source_feed: `${name}/prs`,
        date_found: today(),
        status: 'new',
      })
      seen.add(norm)
    }
  }

  state.last_pr_number[name] = maxPR
  return candidates
}

// ── Source: RSS ───────────────────────────────────────────────────────────────

const rssParser = new Parser({ timeout: 10_000 })

async function pollRSS(
  { url: feedUrl, name, filter }: typeof RSS_FEEDS[number],
  state: State,
  seen: Set<string>,
): Promise<Candidate[]> {
  let xml: string
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'systemsfailed-discovery-bot' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) {
      console.warn(`  [${name}] HTTP ${res.status} — skipped`)
      return []
    }
    xml = await res.text()
  } catch {
    console.warn(`  [${name}] network error — skipped`)
    return []
  }

  let feed: Awaited<ReturnType<typeof rssParser.parseString>>
  try {
    feed = await rssParser.parseString(xml)
  } catch {
    console.warn(`  [${name}] RSS parse error — skipped`)
    return []
  }

  // First run: 30-day lookback. Subsequent runs: since last item seen.
  const lastDate = state.last_feed_date[name]
    ? new Date(state.last_feed_date[name])
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const candidates: Candidate[] = []
  let newestDate = lastDate

  for (const item of feed.items ?? []) {
    const pub = item.pubDate ? new Date(item.pubDate) : null
    if (!pub || pub <= lastDate) continue
    if (pub > newestDate) newestDate = pub

    const url = item.link ?? ''
    if (!url) continue
    const norm = normalizeUrl(url)
    if (seen.has(norm)) continue

    const text = [item.title ?? '', item.contentSnippet ?? ''].join(' ')
    const matches = filter === 'ai-incident' ? hasAiFailureKeyword(text) : hasKeyword(text)
    if (!matches) continue

    candidates.push({
      url,
      discovered_title: item.title ?? url,
      source_feed: name,
      date_found: today(),
      status: 'new',
    })
    seen.add(norm)
  }

  state.last_feed_date[name] = newestDate.toISOString()
  return candidates
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('systemsfailed discovery bot\n')

  if (!GITHUB_TOKEN) {
    console.warn('Warning: GITHUB_TOKEN not set — GitHub API rate-limited to 60 req/hr\n')
  }

  const state    = loadState()
  const ingested = ingestedSources()
  const { candidates: existing, healed } = reconcile(loadCandidates(), ingested)
  const seen     = buildSeenSet(existing, ingested)
  const allNew: Candidate[] = []

  if (healed > 0) console.log(`reconciled ${healed} candidate(s) already in the archive\n`)

  // --backfill: harvest the curated lists' existing contents, then stop. Run
  // once; the commit poller covers everything added afterwards.
  if (process.argv.includes('--backfill')) {
    const dryRun = process.argv.includes('--dry-run')
    for (const source of GITHUB_SOURCES) {
      process.stdout.write(`Backfill  ${source.name.padEnd(32)}`)
      try {
        const found = await backfillReadme(source, seen)
        console.log(`+${found.length}`)
        allNew.push(...found)
      } catch (e) {
        console.warn(`error — ${e}`)
      }
      await delay(600)
    }
    if (dryRun) {
      const { accepted, blocked } = previewBackfill(allNew)
      console.log(`\nDry run: ${accepted.length} candidate(s) accepted · ${blocked} gated · queue unchanged`)
      for (const candidate of accepted.slice(0, 10)) {
        console.log(`  ${candidate.discovered_title} — ${candidate.url}`)
      }
      if (accepted.length > 10) console.log(`  …and ${accepted.length - 10} more`)
    } else {
      const { candidates: gated, blocked } = gate([...existing, ...allNew])
      const reviewed = stageBackfillForReview(gated, new Set(allNew.map(candidate => candidate.url)))
      saveCandidates(reviewed)
      console.log(`\n✓ ${allNew.length} candidate(s) backfilled for review · ${blocked} gated · queue total: ${reviewed.length}`)
    }
    return
  }

  // GitHub commit-diff sources
  for (const source of GITHUB_SOURCES) {
    process.stdout.write(`GitHub  ${source.name.padEnd(32)}`)
    try {
      const found = await pollGitHubCommits(source, state, seen)
      console.log(`+${found.length}`)
      allNew.push(...found)
    } catch (e) {
      console.warn(`error — ${e}`)
    }
    await delay(600)
  }

  // danluu open PRs (new postmortems often land here before merge)
  process.stdout.write(`PRs     danluu/post-mortems              `)
  try {
    const found = await pollGitHubPRs('danluu/post-mortems', 'danluu/post-mortems', state, seen)
    console.log(`+${found.length}`)
    allNew.push(...found)
  } catch (e) {
    console.warn(`error — ${e}`)
  }
  await delay(600)

  // RSS feeds
  for (const feed of RSS_FEEDS) {
    process.stdout.write(`RSS     ${feed.name.padEnd(32)}`)
    try {
      const found = await pollRSS(feed, state, seen)
      console.log(`+${found.length}`)
      allNew.push(...found)
    } catch (e) {
      console.warn(`error — ${e}`)
    }
  }

  const { candidates: gated, blocked } = gate([...existing, ...allNew])
  saveCandidates(gated)
  saveState(state)

  console.log(`\n✓ ${allNew.length} new candidate(s)${blocked ? ` · ${blocked} gated` : ''} · queue total: ${gated.length}`)
}

// Only poll when run directly — `queue.ts` imports the reconcile helpers.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e); process.exit(1) })
}

export {
  extractBackfillCandidates,
  ingestedSources,
  reconcile,
  isDenied,
  gate,
  previewBackfill,
  hasKeyword,
  hasAiFailureKeyword,
  stageBackfillForReview,
}
