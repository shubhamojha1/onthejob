import assert from 'node:assert/strict'
import test from 'node:test'
import { escapeXml } from './xml'

test('escapeXml neutralises every XML metacharacter', () => {
  assert.equal(
    escapeXml(`AT&T <b> "quoted" 'single'`),
    'AT&amp;T &lt;b&gt; &quot;quoted&quot; &apos;single&apos;',
  )
})

test('escapeXml escapes the ampersand first, so entities are not double-escaped', () => {
  assert.equal(escapeXml('a < b'), 'a &lt; b')
  assert.equal(escapeXml('&amp;'), '&amp;amp;')
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(escapeXml('& < > " \'')))
})

test('escapeXml leaves ordinary prose untouched', () => {
  const s = 'All GitHub.com services were inaccessible for 36 minutes.'
  assert.equal(escapeXml(s), s)
})
