#!/usr/bin/env tsx
/**
 * Extraction pipeline — turns a postmortem URL into a draft incident PR.
 * Thin CLI wrapper around scripts/ingest-core.ts (shared with the scheduled
 * statuspage worker).
 *
 * Usage:  npm run ingest -- <url>
 *         /ingest <url>  (Claude Code slash command)
 *
 * LLM backend:
 *   ANTHROPIC_API_KEY set → Anthropic SDK (ANTHROPIC_MODEL, default claude-sonnet-4-6)
 *   otherwise             → `claude -p` CLI, subscription auth (CLAUDE_CLI_MODEL optional)
 */

import {
  IngestError,
  callLLM,
  checkBackend,
  checkGhCli,
  createDraftPr,
  detectBackend,
  extractIncident,
  fetchPageText,
  loadExistingSourceUrls,
  markQueueDone,
  saveToArchive,
  validateIncident,
  writeIncidentFile,
} from './ingest-core.js'
import { verifyGrounding } from './grounding.js'

// ── Preflight ─────────────────────────────────────────────────────────────────

const url = process.argv[2]
if (!url) {
  console.error('Usage: npm run ingest -- <url>')
  process.exit(1)
}

const backend = detectBackend()
if (!checkBackend(backend)) {
  if (backend === 'sdk') {
    console.error('Error: ANTHROPIC_API_KEY is not set.')
  } else {
    console.error('Error: ANTHROPIC_API_KEY is not set and the `claude` CLI is not in PATH.')
    console.error('Either export ANTHROPIC_API_KEY or install Claude Code and run: claude login')
  }
  process.exit(1)
}

if (!checkGhCli()) {
  console.error('Error: GitHub CLI (gh) is not installed or not in PATH.')
  console.error('Install at https://cli.github.com then run: gh auth login')
  process.exit(1)
}

if (loadExistingSourceUrls().has(url)) {
  console.error(`Already in content/incidents/ — skipping.`)
  process.exit(0)
}

try {
  // ── Fetch ─────────────────────────────────────────────────────────────────
  console.log(`\nFetching ${url}`)
  const pageText = await fetchPageText(url)
  console.log(`  ${pageText.length} chars extracted`)

  // ── LLM extraction ────────────────────────────────────────────────────────
  console.log(`\nExtracting via ${backend === 'sdk' ? `SDK (${process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'})` : 'claude CLI'} ...`)
  const { extracted, confidence, tweet } = await extractIncident(url, pageText, backend)

  // ── Zod validation ────────────────────────────────────────────────────────
  const incident = validateIncident(extracted, url)
  console.log(`  ✓ valid — id: ${incident.id}, confidence: ${confidence}`)

  // ── Grounding validation ──────────────────────────────────────────────────
  console.log('\nGrounding check ...')
  const grounding = await verifyGrounding(incident, pageText, p => callLLM(p, backend))
  for (const c of grounding.checks) {
    console.log(`  ${c.pass ? '✓' : '✗'} ${c.name.padEnd(22)} ${c.detail}`)
  }
  if (!grounding.pass) {
    console.warn('\n  ⚠ Grounding FAILED — the PR will be flagged grounding-failed for manual review.')
  }

  // ── Internet Archive ──────────────────────────────────────────────────────
  console.log('\nSaving to Internet Archive ...')
  const archiveUrl = await saveToArchive(url)
  console.log(archiveUrl ? `  → ${archiveUrl}` : '  No archive URL returned — leaving blank')

  // ── Write + PR ────────────────────────────────────────────────────────────
  const mdPath = writeIncidentFile(incident, archiveUrl)
  console.log(`\nWrote ${mdPath}`)

  console.log('\nCreating draft PR ...')
  const prUrl = createDraftPr(incident, confidence, url, grounding, tweet)
  console.log(`  ✓ ${prUrl}`)

  markQueueDone(url)
  console.log('\n✓ Done. Review the draft PR and merge when satisfied.')
} catch (e) {
  if (e instanceof IngestError) {
    console.error(`\n[${e.stage}] ${e.message}`)
    if (e.stage === 'pr') {
      console.error('The incident file was written — commit it manually.')
    }
  } else {
    console.error('\n', e instanceof Error ? e.message : e)
  }
  process.exit(1)
}
