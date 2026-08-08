/**
 * Checks every incident source URL.
 * Exits non-zero for missing/server-error responses or timeouts. Bot-protection
 * and rate-limit responses still prove the source host is live.
 * Used in CI on every PR.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INCIDENTS_DIR = join(ROOT, 'content', 'incidents')

type CheckResult = { status: number; method: 'HEAD' | 'GET' }
type Result = { id: string; url: string; status: number | string; method: 'HEAD' | 'GET' }
const GET_ONLY_HOSTS = ['openai.com']
const ACCESS_RESTRICTED_STATUSES = new Set([403, 429])

export function isSourceUnavailable(status: number): boolean {
  return status >= 400 && !ACCESS_RESTRICTED_STATUSES.has(status)
}

export async function checkSourceUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckResult> {
  const common = {
    redirect: 'follow' as const,
    signal: AbortSignal.timeout(15_000),
    headers: {
      'User-Agent': 'systemsfailed-link-check/1.0',
      // Avoid carrying a rejected HEAD request into a fallback GET on the
      // same connection; some bot protections key their decision that way.
      Connection: 'close',
    },
  }

  const getProbe = async (): Promise<CheckResult> => {
    const response = await fetchImpl(url, {
      ...common,
      method: 'GET',
      headers: { ...common.headers, Range: 'bytes=0-0' },
    })
    await response.body?.cancel()
    return { status: response.status, method: 'GET' }
  }

  const host = new URL(url).hostname.replace(/^www\./, '')
  if (GET_ONLY_HOSTS.some(known => host === known || host.endsWith(`.${known}`))) {
    return getProbe()
  }

  const head = await fetchImpl(url, { ...common, method: 'HEAD' })
  if (head.status < 400) return { status: head.status, method: 'HEAD' }

  // Some operator sites reject HEAD even though the source is publicly readable.
  // Ask for one byte and cancel the body after the response headers arrive.
  return getProbe()
}

async function main(): Promise<void> {
  const files = readdirSync(INCIDENTS_DIR).filter(file => file.endsWith('.md')).sort()
  const results: Result[] = []

  for (const file of files) {
    const raw = readFileSync(join(INCIDENTS_DIR, file), 'utf-8')
    const { data } = matter(raw)
    const id = data.id as string
    const url = data.source as string

    process.stdout.write(`Checking ${id}... `)
    try {
      const result = await checkSourceUrl(url)
      results.push({ id, url, ...result })
      const fallback = result.method === 'GET' ? ' via GET' : ''
      const restricted = ACCESS_RESTRICTED_STATUSES.has(result.status) ? ' protected' : ''
      console.log(isSourceUnavailable(result.status)
        ? `FAIL [${result.status}${fallback}]`
        : `OK [${result.status}${restricted}${fallback}]`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({ id, url, status: message, method: 'HEAD' })
      console.log(`ERR  ${message}`)
    }
  }

  const failures = results.filter(result =>
    typeof result.status !== 'number' || isSourceUnavailable(result.status),
  )

  console.log(`\n${results.length} links checked`)
  if (failures.length > 0) {
    console.error(`\n${failures.length} failure(s):`)
    failures.forEach(failure =>
      console.error(`  [${failure.status}] ${failure.id}: ${failure.url}`),
    )
    process.exitCode = 1
  } else {
    console.log('All links OK ✓')
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
