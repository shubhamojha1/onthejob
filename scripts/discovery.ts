#!/usr/bin/env tsx
/**
 * Discovery bot — polls sources for candidate engineering postmortems and
 * appends new entries to content/queue/candidates.json.
 *
 * Never writes to content/incidents/. The GitHub Action commits only content/queue/.
 *
 * Run manually: npm run discover
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

if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN not set — GitHub API rate-limited to 60 req/hr\n')
}

const KEYWORDS = [
  'outage', 'incident', 'postmortem', 'post-mortem',
  'rca', 'root cause', 'degradation', 'service disruption',
]

const GITHUB_SOURCES = [
  { repo: 'danluu/post-mortems',               path: 'README.md', name: 'danluu/post-mortems' },
  { repo: 'hjacobs/kubernetes-failure-stories', path: 'README.md', name: 'k8s-failure-stories' },
  { repo: 'lorin/incidents',                    path: 'README.md', name: 'lorin/incidents' },
]

const RSS_FEEDS = [
  { url: 'https://blog.cloudflare.com/rss/',             name: 'cloudflare-blog' },
  { url: 'https://slack.engineering/feed/',              name: 'slack-engineering' },
  { url: 'https://github.blog/engineering/feed/',        name: 'github-engineering' },
  { url: 'https://netflixtechblog.com/feed',             name: 'netflix-tech-blog' },
  { url: 'https://stripe.com/blog/engineering/rss',      name: 'stripe-engineering' },
  { url: 'https://sreweekly.com/feed/',                  name: 'sre-weekly' },
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
  status: 'new' | 'done' | 'rejected'
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

function hasKeyword(text: string): boolean {
  const lo = text.toLowerCase()
  return KEYWORDS.some(k => lo.includes(k))
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

/** Seed the dedup set from existing committed incidents and the current queue. */
function buildSeenSet(existing: Candidate[]): Set<string> {
  const seen = new Set<string>()
  if (existsSync(INCIDENTS)) {
    for (const f of readdirSync(INCIDENTS)) {
      if (!f.endsWith('.md')) continue
      const { data } = matter(readFileSync(resolve(INCIDENTS, f), 'utf-8'))
      if (data.source) seen.add(normalizeUrl(String(data.source)))
    }
  }
  for (const c of existing) seen.add(normalizeUrl(c.url))
  return seen
}

async function ghFetch(url: string, accept = 'application/vnd.github.v3+json'): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: accept,
      'User-Agent': 'onthejob-discovery-bot',
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
  { url: feedUrl, name }: typeof RSS_FEEDS[number],
  state: State,
  seen: Set<string>,
): Promise<Candidate[]> {
  let xml: string
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'onthejob-discovery-bot' },
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
    if (!hasKeyword(text)) continue

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
  console.log('onthejob discovery bot\n')

  const state    = loadState()
  const existing = loadCandidates()
  const seen     = buildSeenSet(existing)
  const allNew: Candidate[] = []

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

  saveCandidates([...existing, ...allNew])
  saveState(state)

  console.log(`\n✓ ${allNew.length} new candidate(s) · queue total: ${existing.length + allNew.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
