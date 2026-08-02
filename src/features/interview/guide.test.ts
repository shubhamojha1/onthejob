import assert from 'node:assert/strict'
import test from 'node:test'
import type { InterviewIndexEntry } from '../../schema/incident'
import { buildInterviewGuide } from './guide'

const entries: InterviewIndexEntry[] = [
  {
    id: 'acme-2025-retry-storm',
    company: 'Acme',
    year: 2025,
    title: 'Retries overwhelmed the control plane',
    classes: ['cascade', 'dependency'],
    patterns: ['retry-storm', 'shared-dependency'],
    lesson: 'GKE clients need bounded retries during control-plane recovery.',
    mechanism: 'Unbounded client retries saturated the shared control plane.',
    interview: 'Bound retries and isolate shared dependencies.',
  },
  {
    id: 'example-2024-overload',
    company: 'Example',
    year: 2024,
    title: 'A queue collapsed under load',
    classes: ['cascade'],
    patterns: ['missing-backpressure'],
    lesson: 'Queues need explicit admission control.',
    mechanism: 'Producers admitted work faster than consumers could drain it.',
    interview: 'Use backpressure before the queue becomes the outage.',
  },
]

test('a multi-class incident is browsable under every relevant topic', () => {
  const guide = buildInterviewGuide(entries)

  assert.deepEqual(guide.groups.map(group => group.key), ['cascade', 'dependency'])
  assert.deepEqual(
    guide.groups.find(group => group.key === 'cascade')?.items.map(item => item.id),
    ['acme-2025-retry-storm', 'example-2024-overload'],
  )
  assert.deepEqual(
    guide.groups.find(group => group.key === 'dependency')?.items.map(item => item.id),
    ['acme-2025-retry-storm'],
  )
  assert.equal(guide.incidentCount, 2)
})

test('search filters talking points while preserving their relevant topics', () => {
  const guide = buildInterviewGuide(entries, 'Acme')

  assert.deepEqual(guide.groups.map(group => group.key), ['cascade', 'dependency'])
  assert.ok(guide.groups.every(group => group.items.length === 1))
  assert.equal(guide.incidentCount, 1)
})

test('searching for a topic returns everything filed under that topic', () => {
  const guide = buildInterviewGuide(entries, 'cascading failure')

  assert.deepEqual(guide.groups.map(group => group.key), ['cascade'])
  assert.equal(guide.groups[0]?.items.length, 2)
})

test('search finds technologies and lessons outside the displayed talking point', () => {
  const guide = buildInterviewGuide(entries, 'Kubernetes')

  assert.deepEqual(guide.groups.map(group => group.key), ['cascade', 'dependency'])
  assert.equal(guide.incidentCount, 1)
})

test('search treats natural spacing and kebab-case patterns as equivalent', () => {
  const guide = buildInterviewGuide(entries, 'retry storm')

  assert.equal(guide.incidentCount, 1)
  assert.deepEqual(guide.groups.map(group => group.key), ['cascade', 'dependency'])
})
