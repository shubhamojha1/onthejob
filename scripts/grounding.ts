#!/usr/bin/env tsx
/**
 * Grounding validator — checks an extracted incident against its source text.
 * Runs after Zod validation, before the draft PR. Structural validity is
 * Zod's job; this checks the content is TRUE TO SOURCE:
 *
 *   quote-verbatim      source_quote is a verbatim substring of the source
 *   date-grounded       incident.date appears in the source in some format
 *   timestamps-grounded clock times / ISO dates in narrative fields appear in source
 *   root-cause-support  LLM verifier confirms trigger+mechanism with a verbatim
 *                       evidence sentence (skipped with --no-llm)
 *
 * A failed report never blocks the PR — it flags it (grounding-failed label +
 * report table in the PR body) so a human reviews before merging.
 *
 * Standalone: npm run ground -- <content/incidents/foo.md> [source-url]
 *   (re-checks an existing entry; fetches its `source` URL unless one is given)
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { IncidentSchema } from '../src/schema/incident.js'
import type { Incident } from '../src/schema/incident.js'

export interface GroundingCheck {
  name: string
  pass: boolean
  detail: string
}

export interface GroundingReport {
  pass: boolean
  checks: GroundingCheck[]
}

// ── Text normalization ────────────────────────────────────────────────────────

/** Lowercase, straighten quotes/dashes, collapse whitespace — for substring checks. */
export function normalize(s: string): string {
  return s
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Alphanumeric skeleton — for verbatim-quote matching. Punctuation and layout
 * differ between the quote and the page (line-wrap markers, code-comment
 * asterisks, smart punctuation), so compare only the word stream.
 */
export function skeleton(s: string): string {
  return normalize(s).replace(/[^a-z0-9]+/g, ' ').trim()
}

// ── Deterministic checks ──────────────────────────────────────────────────────

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december']

/** Variants a YYYY-MM-DD date might appear as in prose. */
export function dateVariants(isoDate: string): string[] {
  const [y, m, d] = isoDate.split('-')
  const month = MONTHS[Number(m) - 1]
  const mon = month.slice(0, 3)
  const day = String(Number(d)) // no leading zero
  return [
    isoDate,
    `${month} ${day}`, `${day} ${month}`,       // july 12 / 12 july
    `${mon} ${day}`, `${day} ${mon}`,           // jul 12 / 12 jul
    `${m}/${d}/${y}`, `${d}/${m}/${y}`,         // 07/12/2021 / 12/07/2021
    `${Number(m)}/${Number(d)}/${y}`,           // 7/12/2021
  ]
}

function checkQuoteVerbatim(incident: Incident, source: string): GroundingCheck {
  const name = 'quote-verbatim'
  if (!incident.source_quote || !incident.source_quote.trim()) {
    return { name, pass: false, detail: 'no source_quote extracted' }
  }
  const found = skeleton(source).includes(skeleton(incident.source_quote))
  return {
    name,
    pass: found,
    detail: found ? 'source_quote found verbatim in source' : 'source_quote NOT found in source text',
  }
}

function checkDateGrounded(incident: Incident, source: string): GroundingCheck {
  const name = 'date-grounded'
  const variants = dateVariants(incident.date)
  const hit = variants.find(v => source.includes(v))
  // Month-day forms without a year only count if the year appears somewhere too
  const yearOk = source.includes(incident.date.slice(0, 4))
  const pass = Boolean(hit && (hit.includes(incident.date.slice(0, 4)) || yearOk))
  return {
    name,
    pass,
    detail: pass
      ? `date matched as "${hit}"`
      : `date ${incident.date} not found in source (tried ${variants.length} formats)`,
  }
}

function checkTimestampsGrounded(incident: Incident, source: string): GroundingCheck {
  const name = 'timestamps-grounded'
  const narrative = [incident.impact, incident.trigger, incident.mechanism, incident.duration].join(' ')
  const tokens = new Set<string>([
    ...(narrative.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g) ?? []),   // clock times
    ...(narrative.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []),          // ISO dates
  ])
  if (tokens.size === 0) {
    return { name, pass: true, detail: 'no explicit timestamps in narrative fields' }
  }
  const missing = [...tokens].filter(t => {
    if (t.match(/^\d{4}-\d{2}-\d{2}$/)) return !dateVariants(t).some(v => source.includes(v))
    return !source.includes(t)
  })
  return {
    name,
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `all ${tokens.size} timestamp(s) found in source`
      : `not in source: ${missing.join(', ')}`,
  }
}

// ── LLM root-cause check ──────────────────────────────────────────────────────

async function checkRootCauseSupport(
  incident: Incident,
  source: string,
  callLLM: (prompt: string) => Promise<string>,
): Promise<GroundingCheck> {
  const name = 'root-cause-support'
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const template = readFileSync(resolve(ROOT, 'prompts/verify-grounding.md'), 'utf-8')
  const prompt = template
    .replace('{{TRIGGER}}', incident.trigger)
    .replace('{{MECHANISM}}', incident.mechanism)
    .replace('{{TEXT}}', source.slice(0, 80_000))

  let raw: string
  try {
    raw = await callLLM(prompt)
  } catch (e) {
    return { name, pass: false, detail: `verifier call failed: ${e instanceof Error ? e.message : e}` }
  }

  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let verdict: { supported?: boolean; evidence?: string; reason?: string }
  try {
    verdict = JSON.parse(jsonStr)
  } catch {
    return { name, pass: false, detail: `verifier returned unparseable output: ${raw.slice(0, 200)}` }
  }

  if (!verdict.supported) {
    return { name, pass: false, detail: `not supported: ${verdict.reason ?? 'no reason given'}` }
  }
  // The evidence sentence must itself be verbatim in the source — otherwise the
  // verifier may have hallucinated its own support.
  if (!verdict.evidence || !skeleton(source).includes(skeleton(verdict.evidence))) {
    return { name, pass: false, detail: 'verifier evidence sentence not found verbatim in source' }
  }
  return { name, pass: true, detail: `supported by: "${verdict.evidence.slice(0, 140)}..."` }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function verifyGrounding(
  incident: Incident,
  sourceText: string,
  callLLM?: (prompt: string) => Promise<string>,
): Promise<GroundingReport> {
  const norm = normalize(sourceText)

  const checks: GroundingCheck[] = [
    checkQuoteVerbatim(incident, sourceText),
    checkDateGrounded(incident, norm),
    checkTimestampsGrounded(incident, norm),
  ]

  if (callLLM) {
    // Raw text goes to the verifier prompt — normalization would mangle the
    // sentence it must copy verbatim.
    checks.push(await checkRootCauseSupport(incident, sourceText, callLLM))
  } else {
    checks.push({ name: 'root-cause-support', pass: true, detail: 'skipped (no LLM backend)' })
  }

  return { pass: checks.every(c => c.pass), checks }
}

// ── Standalone CLI: npm run ground -- <incident.md> [url] [--no-llm] ─────────

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(
  process.argv[1].split(/[\\/]/).pop() ?? ' ',
)

if (invokedDirectly) {
  const args = process.argv.slice(2).filter(a => a !== '--no-llm')
  const noLlm = process.argv.includes('--no-llm')
  const file = args[0]
  if (!file) {
    console.error('Usage: npm run ground -- <content/incidents/foo.md> [source-url] [--no-llm]')
    process.exit(1)
  }

  const { data } = matter(readFileSync(resolve(process.cwd(), file), 'utf-8'))
  const parsed = IncidentSchema.safeParse(data)
  if (!parsed.success) {
    console.error('File does not pass IncidentSchema — fix it first.')
    process.exit(1)
  }
  const incident = parsed.data
  const url = args[1] ?? incident.source

  const core = await import('./ingest-core.js')
  console.log(`Fetching ${url} ...`)
  const sourceText = await core.fetchPageText(url)
  console.log(`  ${sourceText.length} chars\n`)

  const llm = !noLlm && core.checkBackend(core.detectBackend())
    ? (p: string) => core.callLLM(p)
    : undefined
  if (!llm) console.log('(root-cause-support check skipped — no LLM backend or --no-llm)\n')

  const report = await verifyGrounding(incident, sourceText, llm)
  for (const c of report.checks) {
    console.log(`  ${c.pass ? '✓' : '✗'} ${c.name.padEnd(22)} ${c.detail}`)
  }
  console.log(`\n${report.pass ? '✓ grounding PASSED' : '✗ grounding FAILED'}`)
  process.exit(report.pass ? 0 : 1)
}
