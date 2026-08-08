/**
 * Prebuild step: content/incidents/*.md → src/generated/ + public/data/
 * Run via `npm run prebuild` (also wired to predev and prebuild lifecycle hooks).
 * Fails the build on any schema validation error.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MiniSearch from 'minisearch'
import { FAILURE_CLASS_KEYS } from '../content/taxonomy.js'
import { SITE_URL as SITE } from '../src/lib/site.js'
import { SEARCH_FIELDS, SEARCH_STORE_FIELDS } from '../src/lib/search-config.js'
import { buildRssFeed } from '../src/lib/rss.js'
import { readIncidentCorpus } from './lib/incidents.js'
import type { Incident, InterviewIndexEntry } from '../src/schema/incident.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INCIDENTS_DIR = join(ROOT, 'content', 'incidents')
const GENERATED_DIR = join(ROOT, 'src', 'generated')
const PUBLIC_DATA_DIR = join(ROOT, 'public', 'data')

mkdirSync(GENERATED_DIR, { recursive: true })
mkdirSync(PUBLIC_DATA_DIR, { recursive: true })

const { incidents, errors } = readIncidentCorpus(INCIDENTS_DIR)

if (errors.length > 0) {
  console.error('\nSchema validation failed:\n')
  errors.forEach(e => console.error(e))
  process.exit(1)
}

// Sort newest first, then alphabetically by company
incidents.sort((a, b) => b.year - a.year || a.company.localeCompare(b.company))

// Full data — used by SSG loaders at build time, never shipped to browser
writeFileSync(
  join(GENERATED_DIR, 'incidents-all.json'),
  JSON.stringify(incidents, null, 2),
)

// Index — eagerly loaded by homepage + feeds getStaticPaths
// For Phase 1, includes all fields. Split to summary-only when content > ~50.
writeFileSync(
  join(GENERATED_DIR, 'incidents-index.json'),
  JSON.stringify(incidents, null, 2),
)

// Interview guide — only the fields needed by /interview.
const interviewEntries: InterviewIndexEntry[] = incidents.map(incident => ({
  id: incident.id,
  company: incident.company,
  year: incident.year,
  title: incident.title,
  classes: incident.classes,
  patterns: incident.patterns,
  lesson: incident.lesson,
  mechanism: incident.mechanism,
  interview: incident.interview,
}))
writeFileSync(
  join(GENERATED_DIR, 'interview-index.json'),
  JSON.stringify(interviewEntries, null, 2),
)

// Public copy — served statically, usable for future client-side fetching
writeFileSync(
  join(PUBLIC_DATA_DIR, 'incidents-index.json'),
  JSON.stringify(incidents, null, 2),
)

// Pre-built MiniSearch index for instant client-side search
const ms = new MiniSearch<Incident>({
  idField: 'id',
  fields: [...SEARCH_FIELDS],
  storeFields: [...SEARCH_STORE_FIELDS],
})

ms.addAll(incidents)

writeFileSync(
  join(PUBLIC_DATA_DIR, 'search-index.json'),
  JSON.stringify(ms.toJSON()),
)

// Sitemap — homepage + one URL per incident report
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  [
    `${SITE}/`,
    `${SITE}/interview`,
    ...FAILURE_CLASS_KEYS.map(key => `${SITE}/class/${key}`),
    ...incidents.map(i => `${SITE}/incident/${i.id}`),
  ]
    .map(url => `  <url><loc>${url}</loc></url>`)
    .join('\n') +
  '\n</urlset>\n'
writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap)

// RSS — newest additions to the archive, not newest incidents in the world.
writeFileSync(join(ROOT, 'public', 'feed.xml'), buildRssFeed(incidents, SITE))

console.log(`\n✓ Built index: ${incidents.length} incidents`)
console.log(`  → src/generated/incidents-all.json`)
console.log(`  → src/generated/incidents-index.json`)
console.log(`  → src/generated/interview-index.json`)
console.log(`  → public/data/incidents-index.json`)
console.log(`  → public/data/search-index.json`)
console.log(`  → public/sitemap.xml`)
console.log(`  → public/feed.xml`)
