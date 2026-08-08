import type { Incident } from '../schema/incident'

function taxonomyTokens(incident: Incident): Set<string> {
  return new Set([
    ...incident.classes.map(value => `class:${value}`),
    ...incident.patterns.map(value => `pattern:${value}`),
  ])
}

/**
 * Rank other incidents by how much taxonomy they share with `incident`.
 *
 * A shared tag is worth the inverse of how many incidents carry it. Rare tags
 * therefore contribute more evidence than broad ones. This also makes pattern
 * tags usually outweigh classes without a hand-tuned constant.
 */
function tagWeights(all: Incident[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const incident of all) {
    for (const tag of taxonomyTokens(incident)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return new Map([...counts].map(([tag, n]) => [tag, all.length / n]))
}

export function relatedIncidents(
  incident: Incident,
  all: Incident[],
  limit = 3,
): Incident[] {
  const weights = tagWeights(all)
  const shared = taxonomyTokens(incident)

  return all
    .filter(other => other.id !== incident.id)
    .map(other => ({
      other,
      score: [...taxonomyTokens(other)]
        .filter(tag => shared.has(tag))
        .reduce((sum, tag) => sum + (weights.get(tag) ?? 0), 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.other.year - a.other.year)
    .slice(0, limit)
    .map(({ other }) => other)
}
