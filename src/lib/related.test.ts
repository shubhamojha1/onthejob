import assert from 'node:assert/strict'
import test from 'node:test'
import { relatedIncidents } from './related'
import { loadIncidentCorpus } from '../../scripts/lib/incidents'
import type { Incident } from '../schema/incident'

const all = loadIncidentCorpus()

/** Minimal stand-in — relatedIncidents only reads id, year, classes, patterns. */
function stub(id: string, year: number, classes: string[], patterns: string[]) {
  return { id, year, classes, patterns } as unknown as Incident
}

test('a rare shared tag outranks a common one', () => {
  const subject = stub('subject', 2020, ['split-brain', 'cascade'], ['p0'])
  // One incident shares only the rare class; five share only the common one,
  // which is what makes it common.
  const rare = stub('rare', 2011, ['split-brain'], ['p1'])
  const common = [2, 3, 4, 5, 6].map(n =>
    stub(`common-${n}`, 2024, ['cascade'], [`p${n}`]),
  )

  const ranked = relatedIncidents(subject, [subject, rare, ...common])
  assert.equal(ranked[0].id, 'rare', 'rare tag should outrank the crowd')
})

test('a rare shared pattern outranks a common class without a hand-tuned weight', () => {
  const subject = stub('subject', 2020, ['cascade'], ['shared-pattern'])
  const patternMatch = stub('pattern-match', 2019, ['dependency'], ['shared-pattern'])
  const classMatches = [1, 2, 3, 4].map(n =>
    stub(`class-${n}`, 2024, ['cascade'], [`other-${n}`]),
  )

  const ranked = relatedIncidents(subject, [subject, patternMatch, ...classMatches])
  assert.equal(ranked[0].id, 'pattern-match')
})

test('a class name repeated as a pattern does not inflate a related score', () => {
  const subject = stub('subject', 2020, ['cascade'], ['subject-pattern'])
  const ordinary = stub('ordinary', 2024, ['cascade'], ['ordinary-pattern'])
  const collision = stub('collision', 2024, ['cascade'], ['cascade'])

  const ranked = relatedIncidents(subject, [subject, ordinary, collision])
  assert.deepEqual(ranked.map(i => i.id), ['ordinary', 'collision'])
})

test('the only other split-brain incident is surfaced, not buried by a broader class', () => {
  const subject = all.find(i => i.id === 'github-2018-splitbrain')!
  const siblings = all.filter(i => i.id !== subject.id && i.classes.includes('split-brain'))
  assert.ok(siblings.length > 0, 'fixture assumes a second split-brain incident exists')

  const ranked = relatedIncidents(subject, all).map(i => i.id)
  for (const sibling of siblings) {
    assert.ok(ranked.includes(sibling.id), `${sibling.id} missing from ${ranked.join(', ')}`)
  }
})

test('incidents sharing nothing are excluded, not ranked last', () => {
  const subject = stub('subject', 2020, ['cascade'], ['a'])
  const stranger = stub('stranger', 2024, ['data-loss'], ['b'])

  assert.deepEqual(relatedIncidents(subject, [subject, stranger]), [])
})

test('equal scores break toward the newer incident', () => {
  const subject = stub('subject', 2020, ['cascade'], ['a'])
  const older = stub('older', 2011, ['cascade'], ['b'])
  const newer = stub('newer', 2023, ['cascade'], ['b'])

  const ranked = relatedIncidents(subject, [subject, older, newer])
  assert.deepEqual(ranked.map(i => i.id), ['newer', 'older'])
})

test('an incident never relates to itself', () => {
  for (const incident of all) {
    const ids = relatedIncidents(incident, all).map(i => i.id)
    assert.ok(!ids.includes(incident.id), `${incident.id} matched itself`)
  }
})

test('every real incident has at least one related incident to link to', () => {
  const orphans = all
    .filter(i => relatedIncidents(i, all).length === 0)
    .map(i => i.id)
  assert.deepEqual(orphans, [])
})
