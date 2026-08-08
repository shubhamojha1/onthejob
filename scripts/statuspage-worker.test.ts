import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withQueueRecoveryBeforePolling } from './statuspage-worker.js'

test('replays a pending queue status before polling on the next run', async () => {
  const calls: string[] = []
  let pending = true

  const result = await withQueueRecoveryBeforePolling(
    () => {
      calls.push('poll')
      return 'work'
    },
    {
      dryRun: false,
      hasPending: () => pending,
      sync: () => {
        calls.push('sync')
        pending = false
        return true
      },
    },
  )

  assert.equal(result, 'work')
  assert.deepEqual(calls, ['sync', 'poll'])
})

test('dry runs never push a saved queue status', async () => {
  const calls: string[] = []

  await withQueueRecoveryBeforePolling(
    () => { calls.push('poll') },
    {
      dryRun: true,
      hasPending: () => true,
      sync: () => {
        calls.push('sync')
        return true
      },
    },
  )

  assert.deepEqual(calls, ['poll'])
})

test('does not poll when pending queue recovery fails', async () => {
  let polled = false

  await assert.rejects(
    withQueueRecoveryBeforePolling(
      () => { polled = true },
      {
        dryRun: false,
        hasPending: () => true,
        sync: () => false,
      },
    ),
    /deferring ingestion/,
  )

  assert.equal(polled, false)
})
