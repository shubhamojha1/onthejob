import assert from 'node:assert/strict'
import test from 'node:test'
import { IncidentSchema } from './incident'

const valid = {
  id: 'example-2026-incident',
  company: 'Example',
  title: 'An example incident',
  year: 2026,
  date: '2026-02-28',
  duration: '1 h',
  classes: ['cascade'],
  patterns: ['retry-amplification'],
  impact: 'Users received incorrect answers.',
  trigger: 'A bad index was deployed.',
  mechanism: 'Retrieval returned stale context.',
  lesson: 'Evaluate retrieval independently.',
  interview: 'Discuss retrieval freshness and rollback controls.',
  source: 'https://example.com/postmortem',
  sourceLabel: 'Example engineering',
  date_added: '2026-08-08',
  verified: false,
}

test('AI incidents use the same schema as the rest of the archive', () => {
  assert.equal(IncidentSchema.safeParse(valid).success, true)
})

test('incident dates reject impossible calendar dates', () => {
  const result = IncidentSchema.safeParse({ ...valid, date_added: '2026-02-30' })
  assert.equal(result.success, false)
})

test('incident taxonomy arrays reject duplicate values', () => {
  const result = IncidentSchema.safeParse({ ...valid, patterns: ['retry-amplification', 'retry-amplification'] })
  assert.equal(result.success, false)
})
