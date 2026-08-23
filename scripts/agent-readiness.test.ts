import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PUBLIC = join(ROOT, 'public')
const DIST = join(ROOT, 'dist')

// ── llms.txt ───────────────────────────────────────────────────────────────

test('llms.txt exists in public/', () => {
  assert.ok(existsSync(join(PUBLIC, 'llms.txt')))
})

test('llms.txt starts with site name heading', () => {
  const content = readFileSync(join(PUBLIC, 'llms.txt'), 'utf-8')
  assert.match(content, /^# Systems Failed/)
})

test('llms.txt contains key sections', () => {
  const content = readFileSync(join(PUBLIC, 'llms.txt'), 'utf-8')
  assert.match(content, /## Key pages/)
  assert.match(content, /## Failure classes/)
  assert.match(content, /## Incidents/)
  assert.match(content, /## API \/ Data/)
})

test('llms.txt references sitemap and data endpoints', () => {
  const content = readFileSync(join(PUBLIC, 'llms.txt'), 'utf-8')
  assert.match(content, /sitemap\.xml/)
  assert.match(content, /incidents-index\.json/)
  assert.match(content, /llms-full\.txt/)
})

test('llms-full.txt exists with complete incident content', () => {
  const content = readFileSync(join(PUBLIC, 'llms-full.txt'), 'utf-8')
  assert.match(content, /^# Systems Failed/)
  assert.match(content, /\*\*Trigger\*\*/)
  assert.match(content, /\*\*Mechanism\*\*/)
  assert.match(content, /\*\*Lesson\*\*/)
})

// ── Markdown content negotiation files ─────────────────────────────────────

test('markdown homepage exists at public/md/index.md', () => {
  const content = readFileSync(join(PUBLIC, 'md', 'index.md'), 'utf-8')
  assert.match(content, /^# Systems Failed/)
  assert.match(content, /## Failure classes/)
  assert.match(content, /## Incident archive/)
})

test('markdown incident files exist for every incident', () => {
  const index = JSON.parse(readFileSync(join(ROOT, 'src', 'generated', 'incidents-index.json'), 'utf-8'))
  for (const incident of index) {
    const mdPath = join(PUBLIC, 'md', 'incident', `${incident.id}.md`)
    assert.ok(existsSync(mdPath), `Missing markdown for incident ${incident.id}`)
  }
})

test('markdown incident file has correct structure', () => {
  const index = JSON.parse(readFileSync(join(ROOT, 'src', 'generated', 'incidents-index.json'), 'utf-8'))
  const first = index[0]
  const content = readFileSync(join(PUBLIC, 'md', 'incident', `${first.id}.md`), 'utf-8')
  assert.match(content, /^# /)
  assert.match(content, /## Impact/)
  assert.match(content, /## Trigger/)
  assert.match(content, /## Mechanism/)
  assert.match(content, /## Lesson/)
  assert.match(content, /## Source/)
})

test('markdown class files exist for every failure class', () => {
  const taxonomy = ['split-brain', 'cascade', 'thundering-herd', 'config-change',
    'resource-exhaustion', 'bad-deploy', 'data-loss', 'dns-bgp', 'dependency', 'automation-misfire']
  for (const key of taxonomy) {
    const mdPath = join(PUBLIC, 'md', 'class', `${key}.md`)
    assert.ok(existsSync(mdPath), `Missing markdown for class ${key}`)
  }
})

// ── vercel.json content negotiation config ──────────────────────────────────

test('vercel.json has markdown content negotiation rewrites', () => {
  const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf-8'))
  assert.ok(Array.isArray(config.rewrites), 'rewrites should be an array')
  assert.ok(config.rewrites.length >= 3, 'should have at least 3 rewrite rules')

  const homeRewrite = config.rewrites.find((r: { source: string }) => r.source === '/')
  assert.ok(homeRewrite, 'should have a homepage rewrite')
  assert.ok(homeRewrite.has, 'homepage rewrite should have "has" conditions')
  assert.equal(homeRewrite.destination, '/md/index.md')

  const incidentRewrite = config.rewrites.find((r: { source: string }) => r.source === '/incident/:id')
  assert.ok(incidentRewrite, 'should have an incident rewrite')
  assert.equal(incidentRewrite.destination, '/md/incident/:id.md')

  const classRewrite = config.rewrites.find((r: { source: string }) => r.source === '/class/:key')
  assert.ok(classRewrite, 'should have a class rewrite')
  assert.equal(classRewrite.destination, '/md/class/:key.md')
})

test('vercel.json has Vary header configuration', () => {
  const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf-8'))
  assert.ok(Array.isArray(config.headers), 'headers should be an array')
  const varyRule = config.headers.find((h: { source: string }) => h.source === '/(.*)')
  assert.ok(varyRule, 'should have a catch-all headers rule')
  const varyHeader = varyRule.headers.find((h: { key: string }) => h.key === 'Vary')
  assert.ok(varyHeader, 'should set Vary header')
  assert.match(varyHeader.value, /Accept/)
})

// ── JSON-LD structured data ────────────────────────────────────────────────

test('built homepage contains JSON-LD structured data', () => {
  if (!existsSync(join(DIST, 'index.html'))) return
  const html = readFileSync(join(DIST, 'index.html'), 'utf-8')
  assert.match(html, /application\/ld\+json/)
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)
  assert.ok(match, 'should contain a JSON-LD script tag')
  const data = JSON.parse(match![1])
  assert.equal(data['@type'], 'WebSite')
  assert.equal(data.name, 'Systems Failed')
  assert.match(data.url, /systemsfailed\.dev/)
})

test('built incident pages contain Article JSON-LD', () => {
  if (!existsSync(join(DIST, 'incident'))) return
  const html = readFileSync(join(DIST, 'incident', 'cloudflare-2019-regex.html'), 'utf-8')
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)
  assert.ok(match, 'should contain a JSON-LD script tag')
  const data = JSON.parse(match![1])
  assert.equal(data['@type'], 'Article')
  assert.ok(data.headline)
  assert.ok(data.description)
  assert.ok(data.url)
})

test('built class pages contain CollectionPage JSON-LD', () => {
  if (!existsSync(join(DIST, 'class'))) return
  const html = readFileSync(join(DIST, 'class', 'cascade.html'), 'utf-8')
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)
  assert.ok(match, 'should contain a JSON-LD script tag')
  const data = JSON.parse(match![1])
  assert.equal(data['@type'], 'CollectionPage')
  assert.ok(data.mainEntity)
})

// ── 404 page ───────────────────────────────────────────────────────────────

test('built 404 page has navigation links for agent recovery', () => {
  if (!existsSync(join(DIST, '404.html'))) return
  const html = readFileSync(join(DIST, '404.html'), 'utf-8')
  assert.match(html, /404/)
  assert.match(html, /sitemap\.xml/)
  assert.match(html, /llms\.txt/)
  assert.match(html, /interview/)
  assert.match(html, /class\//)
})

test('built 404 page has proper heading structure', () => {
  if (!existsSync(join(DIST, '404.html'))) return
  const html = readFileSync(join(DIST, '404.html'), 'utf-8')
  assert.match(html, /<h1[^>]*>404/)
  assert.match(html, /<h2[^>]*>Where to look next/)
  assert.match(html, /<h2[^>]*>Failure classes/)
})

// ── Homepage SSG content ───────────────────────────────────────────────────

test('built homepage has multiple heading levels (not flat)', () => {
  if (!existsSync(join(DIST, 'index.html'))) return
  const html = readFileSync(join(DIST, 'index.html'), 'utf-8')
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length
  const h2Count = (html.match(/<h2[\s>]/g) ?? []).length
  assert.ok(h1Count >= 1, 'should have at least one h1')
  assert.ok(h2Count >= 3, `should have at least 3 h2s, found ${h2Count}`)
})

test('built homepage has noscript fallback with incident links', () => {
  if (!existsSync(join(DIST, 'index.html'))) return
  const html = readFileSync(join(DIST, 'index.html'), 'utf-8')
  const noscriptMatch = html.match(/<noscript>([\s\S]*?)<\/noscript>/)
  assert.ok(noscriptMatch, 'should have a noscript block')
  assert.match(noscriptMatch![1], /\/incident\//)
})

test('built homepage taxonomy section has failure class links', () => {
  if (!existsSync(join(DIST, 'index.html'))) return
  const html = readFileSync(join(DIST, 'index.html'), 'utf-8')
  assert.match(html, /oj-taxonomy-summary/)
  assert.match(html, /\/class\/cascade/)
  assert.match(html, /\/class\/split-brain/)
})

// ── robots.txt & index.html references ─────────────────────────────────────

test('index.html links to llms.txt', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf-8')
  assert.match(html, /llms\.txt/)
})

test('index.html has canonical link', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf-8')
  assert.match(html, /rel="canonical"/)
  assert.match(html, /systemsfailed\.dev/)
})
