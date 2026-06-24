/**
 * Save each incident source URL to the Internet Archive Save Page Now API
 * and write the resulting archive_url back into the frontmatter.
 * Skips incidents that already have an archive_url.
 *
 * Run manually: npm run archive
 * Triggered by CI on merge to main (see .github/workflows/archive.yml).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INCIDENTS_DIR = join(ROOT, 'content', 'incidents')

const files = readdirSync(INCIDENTS_DIR).filter(f => f.endsWith('.md')).sort()

for (const file of files) {
  const filepath = join(INCIDENTS_DIR, file)
  const raw = readFileSync(filepath, 'utf-8')
  const parsed = matter(raw)

  if (parsed.data.archive_url) {
    console.log(`SKIP  ${file} (already archived)`)
    continue
  }

  const url = parsed.data.source as string
  console.log(`Saving ${url}`)

  try {
    const res = await fetch(`https://web.archive.org/save/${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({ url, capture_all: '1' }),
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) {
      console.warn(`  WARN ${res.status} — skipping`)
      continue
    }

    // archive.org returns a Location header with the saved URL
    const archiveUrl =
      res.headers.get('Content-Location') ||
      res.headers.get('Location') ||
      `https://web.archive.org/web/*/${url}`

    parsed.data.archive_url = archiveUrl.startsWith('/')
      ? `https://web.archive.org${archiveUrl}`
      : archiveUrl

    writeFileSync(filepath, matter.stringify(parsed.content, parsed.data))
    console.log(`  → ${parsed.data.archive_url}`)

    // Be polite to archive.org
    await new Promise(r => setTimeout(r, 3_000))
  } catch (e) {
    console.error(`  ERR  ${e instanceof Error ? e.message : String(e)}`)
  }
}
