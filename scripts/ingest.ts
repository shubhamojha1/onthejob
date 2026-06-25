#!/usr/bin/env tsx
/**
 * Extraction pipeline — turns a postmortem URL into a draft incident PR.
 *
 * Usage:  npm run ingest -- <url>
 *         /ingest <url>  (Claude Code slash command)
 *
 * Env:    ANTHROPIC_API_KEY  (required)
 *         ANTHROPIC_MODEL    (optional, default: claude-sonnet-4-6)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import matter from 'gray-matter'
import { IncidentSchema } from '../src/schema/incident.js'
import type { Incident } from '../src/schema/incident.js'
import type { Candidate } from './discovery.js'

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INCIDENTS_DIR = resolve(ROOT, 'content/incidents')
const QUEUE_FILE    = resolve(ROOT, 'content/queue/candidates.json')
const PROMPTS_DIR   = resolve(ROOT, 'prompts')

// ── Preflight ─────────────────────────────────────────────────────────────────

const url = process.argv[2]
if (!url) {
  console.error('Usage: npm run ingest -- <url>')
  process.exit(1)
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is not set.')
  process.exit(1)
}

try {
  execSync('gh --version', { stdio: 'ignore' })
} catch {
  console.error('Error: GitHub CLI (gh) is not installed or not in PATH.')
  console.error('Install at https://cli.github.com then run: gh auth login')
  process.exit(1)
}

// Check URL not already in incidents
const existingSourceUrls = new Set(
  existsSync(INCIDENTS_DIR)
    ? readdirSync(INCIDENTS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => String(matter(readFileSync(resolve(INCIDENTS_DIR, f), 'utf-8')).data.source ?? ''))
    : []
)
if (existingSourceUrls.has(url)) {
  console.error(`Already in content/incidents/ — skipping.`)
  process.exit(0)
}

// ── Fetch page text ───────────────────────────────────────────────────────────

console.log(`\nFetching ${url}`)
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; onthejob-bot/1.0; +https://onthejob.dev)',
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

// ── LLM extraction ────────────────────────────────────────────────────────────

const promptTemplate = readFileSync(resolve(PROMPTS_DIR, 'extract-incident.md'), 'utf-8')
const prompt = promptTemplate
  .replace('{{SOURCE_URL}}', url)
  .replace('{{TEXT}}', pageText)

const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
console.log(`\nExtracting with ${model} ...`)

const client = new Anthropic()
const message = await client.messages.create({
  model,
  max_tokens: 2048,
  messages: [{ role: 'user', content: prompt }],
})

const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

// Defensively strip ```json ... ``` if the model wraps it
const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

let extracted: Record<string, unknown>
try {
  extracted = JSON.parse(jsonStr)
} catch {
  console.error('LLM did not return valid JSON:\n', raw)
  process.exit(1)
}

if ('error' in extracted) {
  console.error(`Extraction rejected: ${extracted.error}`)
  process.exit(1)
}

const confidence = (extracted.confidence as string) ?? 'low'
delete extracted.confidence // not in Zod schema

// ── Zod validation ────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const candidate = {
  ...extracted,
  source:        url,
  date_added:    today,
  last_verified: today,
  verified:      false,
  archive_url:   '',
}

const validation = IncidentSchema.safeParse(candidate)
if (!validation.success) {
  console.error('\nSchema validation failed — fix the prompt or file manually:')
  for (const issue of validation.error.issues) {
    console.error(`  ${issue.path.join('.')} — ${issue.message}`)
  }
  process.exit(1)
}

const incident: Incident = validation.data

// Check id collision
if (existsSync(resolve(INCIDENTS_DIR, `${incident.id}.md`))) {
  console.error(`id "${incident.id}" already exists in content/incidents/. Rename it manually.`)
  process.exit(1)
}

console.log(`  ✓ valid — id: ${incident.id}, confidence: ${confidence}`)

// ── Internet Archive ──────────────────────────────────────────────────────────

console.log('\nSaving to Internet Archive ...')
let archiveUrl = ''
try {
  const archRes = await fetch(`https://web.archive.org/save/${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ url, capture_all: '1' }),
    signal: AbortSignal.timeout(60_000),
  })
  const loc = archRes.headers.get('Content-Location') ?? archRes.headers.get('Location') ?? ''
  archiveUrl = loc.startsWith('/') ? `https://web.archive.org${loc}` : loc
  console.log(archiveUrl ? `  → ${archiveUrl}` : '  No archive URL returned — leaving blank')
} catch (e) {
  console.warn(`  Archive failed (${e instanceof Error ? e.message : e}) — continuing`)
}

// ── Write incident file ───────────────────────────────────────────────────────

mkdirSync(INCIDENTS_DIR, { recursive: true })
const finalIncident: Incident = { ...incident, archive_url: archiveUrl }
// gray-matter serialises the data object as YAML frontmatter; content body is empty
const mdContent = matter.stringify('', finalIncident).trimEnd() + '\n'
const mdPath = resolve(INCIDENTS_DIR, `${incident.id}.md`)
writeFileSync(mdPath, mdContent)
console.log(`\nWrote ${mdPath}`)

// ── Draft PR ──────────────────────────────────────────────────────────────────

const branch   = `draft/incident-${incident.id}`
const prTitle  = `Draft incident: ${incident.company} ${incident.year}`
const prBody   = buildPrBody(incident, confidence, url)

// Write PR body to temp file to avoid shell quoting issues on all platforms
const tmpBody = join(tmpdir(), `onthejob-pr-${Date.now()}.md`)
writeFileSync(tmpBody, prBody)

function exec(cmd: string): string {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim()
}

console.log('\nCreating draft PR ...')
let branchCreated = false
try {
  exec(`git checkout -b ${branch}`)
  branchCreated = true
  exec(`git add content/incidents/${incident.id}.md`)
  exec(`git commit -m "Draft incident: ${incident.company} ${incident.year} [skip ci]"`)
  exec(`git push -u origin ${branch}`)

  const prUrl = exec(`gh pr create --draft --title "${prTitle}" --body-file "${tmpBody}"`)

  // Add needs-review label for low-confidence extractions (best-effort)
  if (confidence === 'low') {
    try {
      execSync(`gh label create "needs-review" --color "FBCA04" --description "Extraction needs manual verification" --force`, { cwd: ROOT, stdio: 'ignore' })
      execSync(`gh pr edit "${prUrl}" --add-label "needs-review"`, { cwd: ROOT, stdio: 'ignore' })
    } catch {
      console.warn('  Could not add needs-review label — add it manually if needed')
    }
  }

  console.log(`  ✓ ${prUrl}`)
  exec('git checkout main')
} catch (e) {
  // Best-effort cleanup
  try { exec('git checkout main') } catch {}
  if (branchCreated) {
    try { execSync(`git branch -D ${branch}`, { cwd: ROOT, stdio: 'ignore' }) } catch {}
  }
  console.error('\nPR creation failed:', e instanceof Error ? e.message : e)
  console.error(`The incident file is at ${mdPath} — commit it manually.`)
  process.exit(1)
} finally {
  try { unlinkSync(tmpBody) } catch {}
}

// ── Mark done in queue ────────────────────────────────────────────────────────

if (existsSync(QUEUE_FILE)) {
  const queue: Candidate[] = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  const updated = queue.map(c => c.url === url ? { ...c, status: 'done' as const } : c)
  writeFileSync(QUEUE_FILE, JSON.stringify(updated, null, 2) + '\n')
}

console.log('\n✓ Done. Review the draft PR and merge when satisfied.')

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPrBody(i: Incident, confidence: string, sourceUrl: string): string {
  const badge = confidence === 'high' ? '🟢 high' : confidence === 'medium' ? '🟡 medium' : '🔴 low'
  const warning = confidence === 'low'
    ? '\n> ⚠️ **Low confidence** — verify all fields carefully against the original before merging.\n'
    : ''

  return `## Draft incident: ${i.company} ${i.year}

**Source:** [${i.sourceLabel}](${sourceUrl})
**Confidence:** ${badge}
**Failure classes:** ${i.classes.map(c => `\`${c}\``).join(', ')}
**Patterns:** ${i.patterns.map(p => `\`${p}\``).join(', ')}
${warning}
---

### Impact
${i.impact}

### Trigger
${i.trigger}

### Mechanism
${i.mechanism}

### Lesson
${i.lesson}

### Interview angle
${i.interview}

### Source grounding
> ${i.source_quote ?? '_No source quote extracted._'}

---

<details>
<summary>Full field values</summary>

| Field | Value |
|---|---|
| \`id\` | \`${i.id}\` |
| \`date\` | ${i.date} |
| \`duration\` | ${i.duration} |
| \`date_added\` | ${i.date_added} |
| \`verified\` | false |

</details>

---
*All narrative fields are summaries in our own words. \`source_quote\` is the only verbatim excerpt. Confirm against the original postmortem before merging.*`
}
