import type { Candidate } from '../discovery.js'

export interface QueueStatusUpdate {
  url: string
  status: Candidate['status']
}

const STATUS_PRECEDENCE: Record<Candidate['status'], number> = {
  review: 0,
  new: 1,
  rejected: 2,
  done: 3,
}

export function mergeQueueStatusUpdates(
  earlier: QueueStatusUpdate[],
  later: QueueStatusUpdate[],
): QueueStatusUpdate[] {
  const merged = new Map<string, Candidate['status']>()
  for (const update of [...earlier, ...later]) {
    const current = merged.get(update.url)
    if (!current || STATUS_PRECEDENCE[update.status] > STATUS_PRECEDENCE[current]) {
      merged.set(update.url, update.status)
    }
  }
  return [...merged].map(([url, status]) => ({ url, status }))
}

export function deriveQueueStatusUpdates(
  before: Candidate[],
  after: Candidate[],
): QueueStatusUpdate[] {
  const beforeByUrl = new Map(before.map(candidate => [candidate.url, candidate.status]))
  return after
    .filter(candidate => beforeByUrl.has(candidate.url)
      && beforeByUrl.get(candidate.url) !== candidate.status)
    .map(candidate => ({ url: candidate.url, status: candidate.status }))
}

export function applyQueueStatusUpdates(
  latest: Candidate[],
  updates: QueueStatusUpdate[],
): Candidate[] {
  const updateByUrl = new Map(updates.map(update => [update.url, update.status]))
  return latest.map(candidate => {
    const update = updateByUrl.get(candidate.url)
    if (!update || STATUS_PRECEDENCE[candidate.status] >= STATUS_PRECEDENCE[update]) {
      return candidate
    }
    return { ...candidate, status: update }
  })
}
