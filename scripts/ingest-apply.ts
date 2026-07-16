#!/usr/bin/env tsx
/**
 * Step 2 of manual extraction — validates extracted JSON, archives the source,
 * writes content/incidents/<id>.md, and opens a draft PR.
 *
 * Usage: npm run ingest-apply -- <json-file>
 *
 * The JSON file should contain the object output by Claude after processing
 * the prompt from `npm run ingest-prep`.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve as joinPath } from 'node:path'
import matter from 'gray-matter'
import { IncidentSchema } from '../src/schema/incident.js'
import type { Incident } from '../src/schema/incident.js'
import type { Candidate } from './discovery.js'

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INCIDENTS_DIR = resolve(ROOT, 'content/incidents')
const QUEUE_FILE    = resolve(ROOT, 'content/queue/candidates.json')

// ── Load JSON ─────────────────────────────────────────────────────────────────

const jsonFile = process.argv[2]
if (!jsonFile) {
  console.error('Usage: npm run ingest-apply -- <json-file>')
  process.exit(1)
}

const jsonPath = resolve(process.cwd(), jsonFile)
if (!existsSync(jsonPath)) {
  console.error(`File not found: ${jsonPath}`)
  process.exit(1)
}

const raw = readFileSync(jsonPath, 'utf-8').trim()
// Strip ```json ... ``` if the user saved Claude's response with code fences
const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

let extracted: Record<string, unknown>
try {
  extracted = JSON.parse(jsonStr)
} catch {
  console.error('Could not parse JSON. Make sure the file contains only the JSON object.')
  process.exit(1)
}

if ('error' in extracted) {
  console.error(`Extraction was rejected: ${extracted.error}`)
  process.exit(1)
}

const confidence = (extracted.confidence as string) ?? 'low'
delete extracted.confidence

// ── Zod validation ────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const candidate = {
  ...extracted,
  date_added:    today,
  last_verified: today,
  verified:      false,
  archive_url:   '',
}

const validation = IncidentSchema.safeParse(candidate)
if (!validation.success) {
  console.error('\nSchema validation failed:')
  for (const issue of validation.error.issues) {
    console.error(`  ${issue.path.join('.')} — ${issue.message}`)
  }
  console.error('\nFix the JSON and re-run, or adjust the extracted fields manually.')
  process.exit(1)
}

const incident: Incident = validation.data

// Check id collision
if (existsSync(resolve(INCIDENTS_DIR, `${incident.id}.md`))) {
  console.error(`id "${incident.id}" already exists. Edit the JSON to use a different id.`)
  process.exit(1)
}

console.log(`✓ Schema valid — id: ${incident.id}, confidence: ${confidence}`)

// ── Internet Archive ──────────────────────────────────────────────────────────

console.log(`\nSaving to Internet Archive ...`)
let archiveUrl = ''
try {
  const archRes = await fetch(`https://web.archive.org/save/${incident.source}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ url: incident.source, capture_all: '1' }),
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
const mdContent = matter.stringify('', finalIncident).trimEnd() + '\n'
const mdPath = resolve(INCIDENTS_DIR, `${incident.id}.md`)
writeFileSync(mdPath, mdContent)
console.log(`\nWrote ${mdPath}`)

// ── Draft PR ──────────────────────────────────────────────────────────────────

try {
  execSync('gh --version', { stdio: 'ignore' })
} catch {
  console.error('\ngh CLI not found — skipping PR creation.')
  console.error(`Commit ${mdPath} and open a PR manually.`)
  process.exit(0)
}

const branch  = `draft/incident-${incident.id}`
const prTitle = `Draft incident: ${incident.company} ${incident.year}`
const prBody  = buildPrBody(incident, confidence)

const tmpBody = joinPath(tmpdir(), `systemsfailed-pr-${Date.now()}.md`)
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

  if (confidence === 'low') {
    try {
      execSync(`gh label create "needs-review" --color "FBCA04" --description "Extraction needs manual verification" --force`, { cwd: ROOT, stdio: 'ignore' })
      execSync(`gh pr edit "${prUrl}" --add-label "needs-review"`, { cwd: ROOT, stdio: 'ignore' })
    } catch {
      console.warn('  Could not add needs-review label')
    }
  }

  console.log(`  ✓ ${prUrl}`)
  exec('git checkout main')
} catch (e) {
  try { exec('git checkout main') } catch {}
  if (branchCreated) {
    try { execSync(`git branch -D ${branch}`, { cwd: ROOT, stdio: 'ignore' }) } catch {}
  }
  console.error('\nPR creation failed:', e instanceof Error ? e.message : e)
  console.error(`Incident file is at ${mdPath} — commit and PR manually.`)
  process.exit(1)
} finally {
  try { unlinkSync(tmpBody) } catch {}
}

// ── Mark done in queue ────────────────────────────────────────────────────────

if (existsSync(QUEUE_FILE)) {
  const queue: Candidate[] = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  const updated = queue.map(c => c.url === incident.source ? { ...c, status: 'done' as const } : c)
  writeFileSync(QUEUE_FILE, JSON.stringify(updated, null, 2) + '\n')
}

console.log('\n✓ Done. Review the draft PR and merge when satisfied.')

// ── PR body ───────────────────────────────────────────────────────────────────

function buildPrBody(i: Incident, confidence: string): string {
  const badge   = confidence === 'high' ? '🟢 high' : confidence === 'medium' ? '🟡 medium' : '🔴 low'
  const warning = confidence === 'low'
    ? '\n> ⚠️ **Low confidence** — verify all fields carefully against the original before merging.\n'
    : ''

  return `## Draft incident: ${i.company} ${i.year}

**Source:** [${i.sourceLabel}](${i.source})
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
*All narrative fields are summaries in our own words. \`source_quote\` is the only verbatim excerpt. Confirm against the original before merging.*`
}
