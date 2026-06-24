/**
 * Validate all incident frontmatter against the Zod schema without generating output.
 * Used in CI independently of the build step.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { IncidentSchema } from '../src/schema/incident.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INCIDENTS_DIR = join(ROOT, 'content', 'incidents')

const files = readdirSync(INCIDENTS_DIR).filter(f => f.endsWith('.md')).sort()
let hasErrors = false

for (const file of files) {
  const raw = readFileSync(join(INCIDENTS_DIR, file), 'utf-8')
  const { data } = matter(raw)
  const result = IncidentSchema.safeParse(data)
  if (!result.success) {
    console.error(`FAIL  ${file}`)
    result.error.issues.forEach(i =>
      console.error(`      ${i.path.join('.')}: ${i.message}`)
    )
    hasErrors = true
  } else {
    console.log(`OK    ${file}`)
  }
}

if (hasErrors) {
  console.error(`\n${files.length} files checked — errors above`)
  process.exit(1)
} else {
  console.log(`\n${files.length} incidents validated ✓`)
}
