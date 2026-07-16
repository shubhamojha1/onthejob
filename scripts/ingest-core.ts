#!/usr/bin/env tsx
/**
 * Shared ingest pipeline stages — used by scripts/ingest.ts (manual CLI) and
 * scripts/statuspage-worker.ts (scheduled worker). Pure functions: they throw
 * IngestError on failure instead of calling process.exit, so callers decide
 * how to handle each stage.
 *
 * LLM backend selection (callLLM):
 *   ANTHROPIC_API_KEY set   → @anthropic-ai/sdk  (original behavior)
 *   otherwise               → `claude -p` CLI    (subscription auth, headless)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import matter from 'gray-matter'
import { IncidentSchema } from '../src/schema/incident.js'
import type { Incident } from '../src/schema/incident.js'
import type { Candidate } from './discovery.js'
import type { GroundingReport } from './grounding.js'

export const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const INCIDENTS_DIR = resolve(ROOT, 'content/incidents')
export const QUEUE_FILE    = resolve(ROOT, 'content/queue/candidates.json')
export const PROMPTS_DIR   = resolve(ROOT, 'prompts')

export class IngestError extends Error {
  constructor(public stage: string, message: string) {
    super(message)
    this.name = 'IngestError'
  }
}

export interface ExtractionResult {
  extracted: Record<string, unknown>
  confidence: string
  tweet: string
}

// ── Dedup helpers ─────────────────────────────────────────────────────────────

export function loadExistingSourceUrls(): Set<string> {
  return new Set(
    existsSync(INCIDENTS_DIR)
      ? readdirSync(INCIDENTS_DIR)
          .filter(f => f.endsWith('.md'))
          .map(f => String(matter(readFileSync(resolve(INCIDENTS_DIR, f), 'utf-8')).data.source ?? ''))
      : []
  )
}

// ── Fetch + text extraction ───────────────────────────────────────────────────

export function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&') // last, so &amp;#39; doesn't double-decode
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80_000)
}

export async function fetchPageText(url: string): Promise<string> {
  const html = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; systemsfailed-bot/1.0; +https://systemsfailed.dev)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(20_000),
  }).then(r => {
    if (!r.ok) throw new IngestError('fetch', `HTTP ${r.status}`)
    return r.text()
  })
  return extractText(html)
}

// ── LLM backend ───────────────────────────────────────────────────────────────

export type LLMBackend = 'sdk' | 'claude-cli'

export function detectBackend(): LLMBackend {
  return process.env.ANTHROPIC_API_KEY ? 'sdk' : 'claude-cli'
}

/** True if the selected backend is usable in this environment. */
export function checkBackend(backend: LLMBackend): boolean {
  if (backend === 'sdk') return Boolean(process.env.ANTHROPIC_API_KEY)
  const res = spawnSync('claude', ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  return res.status === 0
}

async function callSdk(prompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
  const client = new Anthropic()
  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}

function callClaudeCli(prompt: string): string {
  const args = ['-p', '--output-format', 'text']
  if (process.env.CLAUDE_CLI_MODEL) args.push('--model', process.env.CLAUDE_CLI_MODEL)
  const res = spawnSync('claude', args, {
    input: prompt,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 300_000,
    shell: process.platform === 'win32', // claude is a .cmd shim on Windows
  })
  if (res.error) throw new IngestError('llm', `claude CLI failed: ${res.error.message}`)
  if (res.status !== 0) {
    throw new IngestError('llm', `claude CLI exited ${res.status}: ${(res.stderr ?? '').slice(0, 500)}`)
  }
  return (res.stdout ?? '').trim()
}

export async function callLLM(prompt: string, backend: LLMBackend = detectBackend()): Promise<string> {
  return backend === 'sdk' ? callSdk(prompt) : callClaudeCli(prompt)
}

// ── Extraction ────────────────────────────────────────────────────────────────

export async function extractIncident(
  url: string,
  pageText: string,
  backend: LLMBackend = detectBackend(),
): Promise<ExtractionResult> {
  const promptTemplate = readFileSync(resolve(PROMPTS_DIR, 'extract-incident.md'), 'utf-8')
  const prompt = promptTemplate
    .replace('{{SOURCE_URL}}', url)
    .replace('{{TEXT}}', pageText)

  const raw = await callLLM(prompt, backend)

  // Defensively strip ```json ... ``` if the model wraps it
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let extracted: Record<string, unknown>
  try {
    extracted = JSON.parse(jsonStr)
  } catch {
    throw new IngestError('extract', `LLM did not return valid JSON:\n${raw.slice(0, 1000)}`)
  }

  if ('error' in extracted) {
    throw new IngestError('extract', `Extraction rejected: ${extracted.error}`)
  }

  const confidence = (extracted.confidence as string) ?? 'low'
  delete extracted.confidence // not in Zod schema
  const tweet = (extracted.tweet as string) ?? ''
  delete extracted.tweet // not in Zod schema — PR-only, not persisted with the incident
  return { extracted, confidence, tweet }
}

// ── Zod validation ────────────────────────────────────────────────────────────

export function validateIncident(extracted: Record<string, unknown>, url: string): Incident {
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
    const issues = validation.error.issues
      .map(i => `  ${i.path.join('.')} — ${i.message}`)
      .join('\n')
    throw new IngestError('validate', `Schema validation failed:\n${issues}`)
  }

  const incident = validation.data
  if (existsSync(resolve(INCIDENTS_DIR, `${incident.id}.md`))) {
    throw new IngestError('validate', `id "${incident.id}" already exists in content/incidents/.`)
  }
  return incident
}

// ── Internet Archive ──────────────────────────────────────────────────────────

export async function saveToArchive(url: string): Promise<string> {
  try {
    const archRes = await fetch(`https://web.archive.org/save/${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ url, capture_all: '1' }),
      signal: AbortSignal.timeout(60_000),
    })
    const loc = archRes.headers.get('Content-Location') ?? archRes.headers.get('Location') ?? ''
    return loc.startsWith('/') ? `https://web.archive.org${loc}` : loc
  } catch {
    return '' // best-effort, blank on failure
  }
}

// ── Write incident file ───────────────────────────────────────────────────────

export function writeIncidentFile(incident: Incident, archiveUrl: string): string {
  mkdirSync(INCIDENTS_DIR, { recursive: true })
  const finalIncident: Incident = { ...incident, archive_url: archiveUrl }
  // gray-matter serialises the data object as YAML frontmatter; content body is empty
  const mdContent = matter.stringify('', finalIncident).trimEnd() + '\n'
  const mdPath = resolve(INCIDENTS_DIR, `${incident.id}.md`)
  writeFileSync(mdPath, mdContent)
  return mdPath
}

// ── Draft PR ──────────────────────────────────────────────────────────────────

// Argument arrays instead of shell strings — commit messages and PR titles
// contain free-form company names. On Windows, `gh`/`claude` are .cmd shims
// that Node refuses to spawn without a shell, so any free-form arg passed to
// them must be sanitized (PR body already travels via --body-file).
const NEEDS_SHELL = process.platform === 'win32'

/** Strip shell metacharacters from a value that must ride a cmd.exe line on Windows. */
function shellSafe(s: string): string {
  return NEEDS_SHELL ? s.replace(/["`$&|<>^%;!()]/g, '') : s
}

export function run(file: string, args: string[], opts: { quiet?: boolean } = {}): string {
  return execFileSync(file, args, {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', opts.quiet ? 'ignore' : 'inherit'],
    shell: NEEDS_SHELL && (file === 'gh' || file === 'claude'), // git.exe is a real exe everywhere
  }).toString().trim()
}

export function checkGhCli(): boolean {
  const res = spawnSync('gh', ['--version'], { stdio: 'ignore', shell: NEEDS_SHELL })
  return res.status === 0
}

export function createDraftPr(
  incident: Incident,
  confidence: string,
  url: string,
  grounding?: GroundingReport,
  tweet?: string,
): string {
  const branch  = `draft/incident-${incident.id}`
  const prTitle = `Draft incident: ${incident.company} ${incident.year}`
  const prBody  = buildPrBody(incident, confidence, url, grounding, tweet)

  // Write PR body to temp file to avoid shell quoting issues on all platforms
  const tmpBody = join(tmpdir(), `systemsfailed-pr-${Date.now()}.md`)
  writeFileSync(tmpBody, prBody)

  let branchCreated = false
  try {
    run('git', ['checkout', '-b', branch])
    branchCreated = true
    run('git', ['add', `content/incidents/${incident.id}.md`])
    run('git', ['commit', '-m', `Draft incident: ${incident.company} ${incident.year} [skip ci]`])
    run('git', ['push', '-u', 'origin', branch])

    const prUrl = run('gh', ['pr', 'create', '--draft', '--title', shellSafe(prTitle), '--body-file', tmpBody])

    // Labels for anything needing extra human attention (best-effort)
    const labels: Array<[string, string, string]> = []
    if (confidence === 'low') {
      labels.push(['needs-review', 'FBCA04', 'Extraction needs manual verification'])
    }
    if (grounding && !grounding.pass) {
      labels.push(['grounding-failed', 'D93F0B', 'Grounding validator found unsupported claims'])
    }
    for (const [name, color, desc] of labels) {
      try {
        run('gh', ['label', 'create', name, '--color', color, '--description', desc, '--force'], { quiet: true })
        run('gh', ['pr', 'edit', prUrl, '--add-label', name], { quiet: true })
      } catch {
        console.warn(`  Could not add ${name} label — add it manually if needed`)
      }
    }

    run('git', ['checkout', 'main'])
    return prUrl
  } catch (e) {
    // Best-effort cleanup
    try { run('git', ['checkout', 'main'], { quiet: true }) } catch {}
    if (branchCreated) {
      try { run('git', ['branch', '-D', branch], { quiet: true }) } catch {}
    }
    throw new IngestError('pr', e instanceof Error ? e.message : String(e))
  } finally {
    try { unlinkSync(tmpBody) } catch {}
  }
}

// ── Queue bookkeeping ─────────────────────────────────────────────────────────

export function markQueueDone(url: string): void {
  if (!existsSync(QUEUE_FILE)) return
  const queue: Candidate[] = JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'))
  if (!queue.some(c => c.url === url)) return
  const updated = queue.map(c => c.url === url ? { ...c, status: 'done' as const } : c)
  writeFileSync(QUEUE_FILE, JSON.stringify(updated, null, 2) + '\n')
}

// ── PR body ───────────────────────────────────────────────────────────────────

function buildPrBody(i: Incident, confidence: string, sourceUrl: string, grounding?: GroundingReport, tweet?: string): string {
  const badge = confidence === 'high' ? '🟢 high' : confidence === 'medium' ? '🟡 medium' : '🔴 low'
  const warning = confidence === 'low'
    ? '\n> ⚠️ **Low confidence** — verify all fields carefully against the original before merging.\n'
    : ''

  let groundingSection = ''
  if (grounding) {
    const rows = grounding.checks
      .map(c => `| ${c.pass ? '✅' : '❌'} | \`${c.name}\` | ${c.detail} |`)
      .join('\n')
    const header = grounding.pass
      ? '### Grounding: ✅ all checks passed'
      : '### Grounding: ❌ FAILED — do not merge without manual verification'
    groundingSection = `
${header}

| | Check | Detail |
|---|---|---|
${rows}
`
  }

  const tweetSection = tweet
    ? `
### Suggested tweet (${tweet.length}/280 chars)

\`\`\`
${tweet}
\`\`\`
`
    : ''

  return `## Draft incident: ${i.company} ${i.year}

**Source:** [${i.sourceLabel}](${sourceUrl})
**Confidence:** ${badge}
**Failure classes:** ${i.classes.map(c => `\`${c}\``).join(', ')}
**Patterns:** ${i.patterns.map(p => `\`${p}\``).join(', ')}
${warning}${groundingSection}
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
${tweetSection}
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
