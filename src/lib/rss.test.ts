import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRssFeed } from './rss'
import type { Incident } from '../schema/incident'

function incident(id: string, dateAdded: string, company = 'A&B'): Incident {
  return {
    id,
    company,
    title: `<${id}>`,
    date_added: dateAdded,
    impact: `Impact "${id}"`,
  } as Incident
}

test('RSS orders additions newest-first, caps the feed, and escapes prose', () => {
  const incidents = Array.from({ length: 51 }, (_, index) =>
    incident(`incident-${String(index).padStart(2, '0')}`, `2026-07-${String((index % 28) + 1).padStart(2, '0')}`),
  )
  incidents.push(incident('newest', '2026-08-08'))

  const xml = buildRssFeed(incidents, 'https://www.systemsfailed.dev')
  assert.equal((xml.match(/<item>/g) ?? []).length, 50)
  assert.ok(xml.indexOf('/incident/newest') < xml.indexOf('/incident/incident-'))
  assert.match(xml, /A&amp;B — &lt;newest&gt;/)
  assert.doesNotMatch(xml, /<title>A&B/)
})
