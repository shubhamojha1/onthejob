/**
 * HEAD-checks every incident source URL.
 * Exits non-zero if any URL returns 4xx/5xx or times out.
 * Used in CI on every PR.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INCIDENTS_DIR = join(ROOT, 'content', 'incidents')

const files = readdirSync(INCIDENTS_DIR).filter(f => f.endsWith('.md')).sort()

type Result = { id: string; url: string; status: number | string }
const results: Result[] = []

for (const file of files) {
  const raw = readFileSync(join(INCIDENTS_DIR, file), 'utf-8')
  const { data } = matter(raw)
  const id = data.id as string
  const url = data.source as string

  process.stdout.write(`Checking ${id}... `)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'systemsfailed-link-check/1.0' },
    })
    results.push({ id, url, status: res.status })
    console.log(res.status >= 400 ? `FAIL [${res.status}]` : `OK [${res.status}]`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({ id, url, status: msg })
    console.log(`ERR  ${msg}`)
  }
}

const failures = results.filter(r => typeof r.status !== 'number' || r.status >= 400)

console.log(`\n${results.length} links checked`)
if (failures.length > 0) {
  console.error(`\n${failures.length} failure(s):`)
  failures.forEach(f => console.error(`  [${f.status}] ${f.id}: ${f.url}`))
  process.exit(1)
} else {
  console.log('All links OK ✓')
}
