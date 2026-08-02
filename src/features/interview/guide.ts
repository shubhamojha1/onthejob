import { FAILURE_CLASSES } from '../../../content/taxonomy'
import type { FailureClassKey } from '../../../content/taxonomy'
import type { InterviewIndexEntry } from '../../schema/incident'

export type InterviewGuideGroup = {
  key: FailureClassKey
  label: string
  description: string
  color: string
  items: InterviewIndexEntry[]
}

export type InterviewGuide = {
  groups: InterviewGuideGroup[]
  incidentCount: number
}

const SEARCH_ALIASES: Record<string, string[]> = {
  kubernetes: ['k8s', 'gke'],
  k8s: ['kubernetes', 'gke'],
  gke: ['kubernetes', 'k8s'],
  postgres: ['postgresql'],
  postgresql: ['postgres'],
}

function searchable(value: string | number) {
  return String(value)
    .toLocaleLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function queryTokens(rawQuery: string) {
  return searchable(rawQuery)
    .split(' ')
    .filter(Boolean)
    .map(token => [token, ...(SEARCH_ALIASES[token] ?? [])])
}

function matchesQuery(value: string, tokens: string[][]) {
  const candidate = searchable(value)
  return tokens.every(options => options.some(term => candidate.includes(term)))
}

function entryMatches(entry: InterviewIndexEntry, tokens: string[][]) {
  return matchesQuery([
    entry.company,
    entry.year,
    entry.title,
    entry.interview,
    entry.lesson,
    entry.mechanism,
    ...entry.patterns,
  ].join(' '), tokens)
}

export function buildInterviewGuide(
  entries: InterviewIndexEntry[],
  rawQuery = '',
): InterviewGuide {
  const tokens = queryTokens(rawQuery)
  const hasQuery = tokens.length > 0

  const groups = (Object.keys(FAILURE_CLASSES) as FailureClassKey[])
    .map(key => {
      const topic = FAILURE_CLASSES[key]
      const topicMatches = hasQuery && matchesQuery(
        `${key} ${topic.label} ${topic.desc}`,
        tokens,
      )
      const items = entries
        .filter(entry => entry.classes.includes(key))
        .filter(entry => !hasQuery || topicMatches || entryMatches(entry, tokens))
        .sort((a, b) => b.year - a.year || a.company.localeCompare(b.company))

      return {
        key,
        label: topic.label,
        description: topic.desc,
        color: topic.color,
        items,
      }
    })
    .filter(group => group.items.length > 0)

  return {
    groups,
    incidentCount: new Set(groups.flatMap(group => group.items.map(item => item.id))).size,
  }
}
