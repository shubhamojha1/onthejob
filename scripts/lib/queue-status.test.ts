import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyQueueStatusUpdates,
  deriveQueueStatusUpdates,
  mergeQueueStatusUpdates,
} from './queue-status.js'
import type { Candidate } from '../discovery.js'

const row = (url: string, status: Candidate['status']): Candidate => ({
  url,
  status,
  discovered_title: url,
  source_feed: 'test',
  date_found: '2026-08-09',
})

test('derives only status transitions made by the worker', () => {
  const updates = deriveQueueStatusUpdates(
    [row('https://a.example', 'new'), row('https://b.example', 'new')],
    [row('https://a.example', 'done'), row('https://b.example', 'new')],
  )

  assert.deepEqual(updates, [{ url: 'https://a.example', status: 'done' }])
})

test('replays worker status transitions on the latest remote queue', () => {
  const merged = applyQueueStatusUpdates(
    [row('https://a.example', 'new'), row('https://remote.example', 'new')],
    [
      { url: 'https://a.example', status: 'rejected' },
      { url: 'https://removed.example', status: 'done' },
    ],
  )

  assert.deepEqual(merged, [
    row('https://a.example', 'rejected'),
    row('https://remote.example', 'new'),
  ])
})

test('never downgrades a status already settled on the remote', () => {
  const merged = applyQueueStatusUpdates(
    [row('https://a.example', 'done')],
    [{ url: 'https://a.example', status: 'rejected' }],
  )

  assert.equal(merged[0].status, 'done')
})

test('combines persisted and current transitions without losing the strongest status', () => {
  const updates = mergeQueueStatusUpdates(
    [{ url: 'https://a.example', status: 'rejected' }],
    [
      { url: 'https://a.example', status: 'done' },
      { url: 'https://b.example', status: 'rejected' },
    ],
  )

  assert.deepEqual(updates, [
    { url: 'https://a.example', status: 'done' },
    { url: 'https://b.example', status: 'rejected' },
  ])
})
