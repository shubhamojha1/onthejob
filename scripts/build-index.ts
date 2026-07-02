/**
 * Prebuild step: content/incidents/*.md → src/generated/ + public/data/
 * Run via `npm run prebuild` (also wired to predev and prebuild lifecycle hooks).
 * Fails the build on any schema validation error.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import MiniSearch from 'minisearch'
import { IncidentSchema } from '../src/schema/incident.js'
import type { Incident } from '../src/schema/incident.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INCIDENTS_DIR = join(ROOT, 'content', 'incidents')
const GENERATED_DIR = join(ROOT, 'src', 'generated')
const PUBLIC_DATA_DIR = join(ROOT, 'public', 'data')

mkdirSync(GENERATED_DIR, { recursive: true })
mkdirSync(PUBLIC_DATA_DIR, { recursive: true })

const files = readdirSync(INCIDENTS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort()

const incidents: Incident[] = []
const errors: string[] = []

for (const file of files) {
  const raw = readFileSync(join(INCIDENTS_DIR, file), 'utf-8')
  const { data } = matter(raw)
  const result = IncidentSchema.safeParse(data)
  if (!result.success) {
    errors.push(
      `${file}:\n` +
      result.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    )
  } else {
    incidents.push(result.data)
  }
}

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

// Public copy — served statically, usable for future client-side fetching
writeFileSync(
  join(PUBLIC_DATA_DIR, 'incidents-index.json'),
  JSON.stringify(incidents, null, 2),
)

// Pre-built MiniSearch index for instant client-side search
const ms = new MiniSearch<Incident>({
  idField: 'id',
  fields: ['title', 'company', 'impact', 'lesson', 'trigger', 'mechanism', 'interview'],
  storeFields: ['id'],
})

ms.addAll(incidents)

writeFileSync(
  join(PUBLIC_DATA_DIR, 'search-index.json'),
  JSON.stringify(ms.toJSON()),
)

// Sitemap — homepage + one URL per incident report
const SITE = 'https://www.systemsfailed.dev'
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  [`${SITE}/`, ...incidents.map(i => `${SITE}/incident/${i.id}`)]
    .map(url => `  <url><loc>${url}</loc></url>`)
    .join('\n') +
  '\n</urlset>\n'
writeFileSync(join(ROOT, 'public', 'sitemap.xml'), sitemap)

console.log(`\n✓ Built index: ${incidents.length} incidents`)
console.log(`  → src/generated/incidents-all.json`)
console.log(`  → src/generated/incidents-index.json`)
console.log(`  → public/data/incidents-index.json`)
console.log(`  → public/data/search-index.json`)
