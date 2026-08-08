import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import {
  extractBackfillCandidates,
  gate,
  hasAiFailureKeyword,
  hasKeyword,
  isDenied,
  previewBackfill,
  stageBackfillForReview,
} from './discovery.js'
import type { Candidate } from './discovery.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('blocks encyclopaedia, social and journalism hosts', () => {
  for (const url of [
    'https://en.wikipedia.org/wiki/Northeast_blackout_of_2003',
    'https://twitter.com/awscloud/status/123',
    'https://x.com/awscloud/status/123',
    'https://www.theregister.com/2021/06/08/fastly_outage/',
    'https://arstechnica.com/information-technology/2017/03/s3-outage/',
    'https://news.ycombinator.com/item?id=13755673',
  ]) {
    assert.equal(isDenied(url), true, url)
  }
})

test('allows first-party engineering and status sources', () => {
  for (const url of [
    'https://aws.amazon.com/message/41926/',
    'https://blog.cloudflare.com/cloudflare-outage-on-july-17-2020/',
    'https://github.blog/2018-10-30-oct21-post-incident-analysis/',
    'https://status.circleci.com/incidents/hr0mm9xmm3x6',
    'https://slack.engineering/a-terrible-horrible-no-good-very-bad-day-at-slack/',
  ]) {
    assert.equal(isDenied(url), false, url)
  }
})

// `amazon.com` on the denylist would take aws.amazon.com with it — three
// incidents in the archive. Subdomain matching makes that failure silent.
test('a denied host does not swallow an unrelated subdomain', () => {
  assert.equal(isDenied('https://aws.amazon.com/message/12345/'), false)
})

test('judges a wayback link by the host it wraps', () => {
  assert.equal(
    isDenied('https://web.archive.org/web/20200101000000/https://en.wikipedia.org/wiki/Outage'),
    true,
  )
  assert.equal(
    isDenied('https://web.archive.org/web/20200101000000/https://blog.example.com/postmortem'),
    false,
  )
})

test('blocks unparseable URLs', () => {
  assert.equal(isDenied('not a url'), true)
})

// A PDF is not disqualifying: the Knight Capital incident is sourced from an
// SEC administrative filing, and primary documents are the point.
test('allows a PDF primary document', () => {
  assert.equal(isDenied('https://www.sec.gov/litigation/admin/2013/34-70694.pdf'), false)
})

// The `status !== 'new'` guard is the only thing keeping the gate from
// rewriting a row the worker already finished. `done` means an incident file
// exists; flipping it to `rejected` would make the queue lie about the archive.
test('gate rejects denied new rows and leaves settled ones alone', () => {
  const row = (url: string, status: Candidate['status']): Candidate =>
    ({ url, discovered_title: 't', source_feed: 'f', date_found: '2026-01-01', status })

  const { candidates, blocked } = gate([
    row('https://en.wikipedia.org/wiki/Outage', 'new'),
    row('https://arstechnica.com/some-outage/', 'done'),
    row('https://blog.cloudflare.com/postmortem/', 'new'),
    row('https://reuters.com/technology/incident', 'review'),
  ])

  assert.equal(blocked, 2)
  assert.deepEqual(candidates.map(c => c.status), ['rejected', 'done', 'new', 'rejected'])
})

// The gate must never contradict the archive's own curation: any hit here means
// the denylist would have rejected an incident already judged worth including.
test('rejects nothing already cited as an incident source', () => {
  const dir = resolve(ROOT, 'content/incidents')
  const denied = readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => String(matter(readFileSync(resolve(dir, f), 'utf-8')).data.source ?? ''))
    .filter(src => src && isDenied(src))
  assert.deepEqual(denied, [])
})

test('backfill ignores duplicates and links back to the curated list itself', () => {
  const markdown = [
    '[Real postmortem](https://engineering.example.com/outage)',
    '[Duplicate](https://engineering.example.com/outage/)',
    '[List issue](https://github.com/danluu/post-mortems/issues/1)',
  ].join('\n')

  const candidates = extractBackfillCandidates(
    markdown,
    { repo: 'danluu/post-mortems', name: 'danluu/post-mortems' },
    new Set(),
    '2026-08-08',
  )

  assert.deepEqual(candidates.map(candidate => candidate.url), [
    'https://engineering.example.com/outage',
  ])
})

test('backfill preview reports only candidates that pass the source gate as accepted', () => {
  const row = (url: string): Candidate => ({
    url,
    discovered_title: 'Incident',
    source_feed: 'backfill',
    date_found: '2026-08-08',
    status: 'new',
  })

  const { accepted, blocked } = previewBackfill([
    row('https://blog.cloudflare.com/postmortem/'),
    row('https://en.wikipedia.org/wiki/Outage'),
  ])

  assert.equal(blocked, 1)
  assert.deepEqual(accepted.map(candidate => candidate.url), [
    'https://blog.cloudflare.com/postmortem/',
  ])
})

test('backfill candidates require manual review before worker ingestion', () => {
  const candidates = [
    {
      url: 'https://operator.example/postmortem',
      discovered_title: 'Incident',
      source_feed: 'backfill',
      date_found: '2026-08-09',
      status: 'new' as const,
    },
  ]

  assert.equal(stageBackfillForReview(candidates, new Set([candidates[0].url]))[0].status, 'review')
})

test('recognizes production AI failures without conventional outage wording', () => {
  for (const text of [
    'Expanding on what we missed after the GPT-4o rollout became sycophantic',
    'What happened after AI Overviews launched to users',
    'Gemini image generation got it wrong in the live app',
    'Recommendation ranking produced unsafe results for customers',
  ]) {
    assert.equal(hasAiFailureKeyword(text), true, text)
  }
})

test('does not queue ordinary AI product announcements', () => {
  assert.equal(hasAiFailureKeyword('Introducing a faster Gemini model for developers'), false)
  assert.equal(hasAiFailureKeyword('New AI features arrive in Search'), false)
  assert.equal(hasAiFailureKeyword('Launching an AI model that helps customers debug production code'), false)
  assert.equal(hasKeyword('Database failure during routine maintenance'), false)
})

test('AI feeds reject case studies and evaluation-only incidents', () => {
  assert.equal(hasAiFailureKeyword('NTT DATA cuts incident analysis time with Codex'), false)
  assert.equal(hasAiFailureKeyword('Third-party cyber evaluations involving OpenAI models'), false)
  assert.equal(hasAiFailureKeyword('Expanding on what we missed after the GPT-4o rollout'), true)
  assert.equal(hasAiFailureKeyword('Our model failed a benchmark evaluation'), false)
  assert.equal(hasAiFailureKeyword('Research found incorrect LLM outputs in a lab test'), false)
})
