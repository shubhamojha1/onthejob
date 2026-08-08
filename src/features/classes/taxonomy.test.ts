import assert from 'node:assert/strict'
import test from 'node:test'
import { FAILURE_CLASS_KEYS, isFailureClassKey } from '../../../content/taxonomy'
import { loadIncidentCorpus } from '../../../scripts/lib/incidents'

test('class routes accept only registered taxonomy keys', () => {
  assert.ok(FAILURE_CLASS_KEYS.length > 0)
  assert.ok(FAILURE_CLASS_KEYS.every(isFailureClassKey))
  assert.equal(isFailureClassKey('toString'), false)
  assert.equal(isFailureClassKey('constructor'), false)
  assert.equal(isFailureClassKey('not-a-class'), false)
})

test('every registered class has an incident page to populate it', () => {
  const incidents = loadIncidentCorpus()

  for (const key of FAILURE_CLASS_KEYS) {
    assert.ok(
      incidents.some(incident => incident.classes.includes(key)),
      `Expected at least one incident in ${key}`,
    )
  }
})
