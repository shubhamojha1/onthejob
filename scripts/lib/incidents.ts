import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { IncidentSchema, type Incident } from '../../src/schema/incident.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DEFAULT_INCIDENTS_DIR = join(ROOT, 'content', 'incidents')

export interface IncidentCorpus {
  incidents: Incident[]
  errors: string[]
}

/** Read and validate the Markdown corpus, the source of truth for every generator and test. */
export function readIncidentCorpus(directory = DEFAULT_INCIDENTS_DIR): IncidentCorpus {
  const incidents: Incident[] = []
  const errors: string[] = []
  const files = readdirSync(directory).filter(file => file.endsWith('.md')).sort()

  for (const file of files) {
    const raw = readFileSync(join(directory, file), 'utf-8')
    const result = IncidentSchema.safeParse(matter(raw).data)
    if (!result.success) {
      errors.push(
        `${file}:\n` +
        result.error.issues.map(issue => `  ${issue.path.join('.')}: ${issue.message}`).join('\n'),
      )
      continue
    }
    incidents.push(result.data)
  }

  return { incidents, errors }
}

export function loadIncidentCorpus(directory = DEFAULT_INCIDENTS_DIR): Incident[] {
  const { incidents, errors } = readIncidentCorpus(directory)
  if (errors.length > 0) throw new Error(`Incident validation failed:\n\n${errors.join('\n\n')}`)
  return incidents
}
