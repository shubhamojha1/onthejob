/**
 * Prebuild step: content/incidents/*.md → src/generated/ + public/data/
 * Run via `npm run prebuild` (also wired to predev and prebuild lifecycle hooks).
 * Fails the build on any schema validation error.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MiniSearch from 'minisearch'
import { FAILURE_CLASSES, FAILURE_CLASS_KEYS } from '../content/taxonomy.js'
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

// llms.txt — machine-readable guide for LLMs and AI agents
const llmsTxt = `# Systems Failed

> A field guide to real engineering incidents, indexed by how the system broke — not by who had the outage.

Systems Failed is a curated archive of ${incidents.length} public engineering postmortems, organized by failure taxonomy. Each incident is indexed by failure class (the mechanism of breakdown), company, year, and recurring patterns. The archive helps engineers study how production systems fail so they can recognize and prevent similar failures.

## Key pages

- [Homepage](${SITE}/): Browse the full incident archive with filters and search
- [Interview Prep](${SITE}/interview): System design interview questions drawn from real failures
- [RSS Feed](${SITE}/feed.xml): Latest incident additions
- [Sitemap](${SITE}/sitemap.xml): All pages on this site

## Failure classes

${Object.entries(FAILURE_CLASSES).map(([key, cls]) =>
  `- [${cls.label}](${SITE}/class/${key}): ${cls.desc}`
).join('\n')}

## Incidents

${incidents.map(i =>
  `- [${i.company} — ${i.title}](${SITE}/incident/${i.id}) (${i.year}): ${i.impact}`
).join('\n')}

## API / Data

- [incidents-index.json](${SITE}/data/incidents-index.json): Full incident metadata (JSON array)
- [search-index.json](${SITE}/data/search-index.json): Pre-built MiniSearch index

## Optional

- [llms-full.txt](${SITE}/llms-full.txt): Complete incident details in plain text
`
writeFileSync(join(ROOT, 'public', 'llms.txt'), llmsTxt)

// llms-full.txt — expanded version with full incident content
const llmsFullTxt = `# Systems Failed — Complete Archive

> ${incidents.length} real engineering postmortems, organized by failure taxonomy.

${incidents.map(i => `## ${i.company} — ${i.title} (${i.year})

- **Date**: ${i.date}
- **Duration**: ${i.duration}
- **Failure classes**: ${i.classes.map(c => FAILURE_CLASSES[c].label).join(', ')}
- **Patterns**: ${i.patterns.join(', ')}
- **Impact**: ${i.impact}
- **Trigger**: ${i.trigger}
- **Mechanism**: ${i.mechanism}
- **Lesson**: ${i.lesson}
- **Source**: ${i.source}
- **URL**: ${SITE}/incident/${i.id}
`).join('\n')}
`
writeFileSync(join(ROOT, 'public', 'llms-full.txt'), llmsFullTxt)

// Markdown version of homepage for content negotiation
const homepageMd = `# Systems Failed — Failure intelligence for engineers

Production breaks. *The pattern repeats.*

A field guide to real engineering incidents, indexed by **how the system broke** — not by who had the outage. Trace the trigger, the cascade, and the lesson before it repeats on your watch.

- **${incidents.length}** incident reports
- **${Object.keys(FAILURE_CLASSES).length}** failure classes
- **${Math.min(...incidents.map(i => i.year))}–${Math.max(...incidents.map(i => i.year))}** years on record

## Failure classes

${Object.entries(FAILURE_CLASSES).map(([key, cls]) =>
  `- [${cls.label}](${SITE}/class/${key}): ${cls.desc}`
).join('\n')}

## Incident archive

${incidents.map(i =>
  `- [${i.company} — ${i.title}](${SITE}/incident/${i.id}) (${i.year}): ${i.impact}`
).join('\n')}

## Resources

- [Interview Prep](${SITE}/interview)
- [RSS Feed](${SITE}/feed.xml)
- [llms.txt](${SITE}/llms.txt)
- [JSON data](${SITE}/data/incidents-index.json)

---

Built by [Shubham Ojha](https://shubham-ojha.com) · [@claudeabuser](https://x.com/claudeabuser)
`
mkdirSync(join(ROOT, 'public', 'md'), { recursive: true })
writeFileSync(join(ROOT, 'public', 'md', 'index.md'), homepageMd)

// Markdown version of each incident for content negotiation
const incidentMdDir = join(ROOT, 'public', 'md', 'incident')
mkdirSync(incidentMdDir, { recursive: true })
for (const i of incidents) {
  const md = `# ${i.company} — ${i.title}

**${i.date}** · ${i.duration} · ${i.classes.map(c => FAILURE_CLASSES[c].label).join(', ')}

## Impact

${i.impact}

## Trigger

${i.trigger}

## Mechanism

${i.mechanism}

## Lesson

${i.lesson}

## Interview lens

${i.interview}

## Patterns

${i.patterns.join(', ')}

## Source

[${i.sourceLabel}](${i.source})

---

[View on systemsfailed.dev](${SITE}/incident/${i.id}) · [All incidents](${SITE}/)
`
  writeFileSync(join(incidentMdDir, `${i.id}.md`), md)
}

// Markdown version of each failure class page
const classMdDir = join(ROOT, 'public', 'md', 'class')
mkdirSync(classMdDir, { recursive: true })
for (const key of FAILURE_CLASS_KEYS) {
  const cls = FAILURE_CLASSES[key]
  const classIncidents = incidents.filter(i => i.classes.includes(key))
  const md = `# ${cls.label} — ${classIncidents.length} real ${classIncidents.length === 1 ? 'incident' : 'incidents'}

${cls.desc}

## Incidents

${classIncidents.map(i =>
  `- [${i.company} — ${i.title}](${SITE}/incident/${i.id}) (${i.year}): ${i.impact}`
).join('\n')}

## Other failure classes

${FAILURE_CLASS_KEYS.filter(k => k !== key).map(k =>
  `- [${FAILURE_CLASSES[k].label}](${SITE}/class/${k}): ${FAILURE_CLASSES[k].desc}`
).join('\n')}

---

[Back to archive](${SITE}/)
`
  writeFileSync(join(classMdDir, `${key}.md`), md)
}

console.log(`\n✓ Built index: ${incidents.length} incidents`)
console.log(`  → src/generated/incidents-all.json`)
console.log(`  → src/generated/incidents-index.json`)
console.log(`  → src/generated/interview-index.json`)
console.log(`  → public/data/incidents-index.json`)
console.log(`  → public/data/search-index.json`)
console.log(`  → public/sitemap.xml`)
console.log(`  → public/feed.xml`)
console.log(`  → public/llms.txt`)
console.log(`  → public/llms-full.txt`)
console.log(`  → public/md/ (markdown content negotiation files)`)
