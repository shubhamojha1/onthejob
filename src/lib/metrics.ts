/**
 * Split impact copy into plain text and "damage readout" metrics — the
 * durations, percentages, times and counts that carry the blast radius.
 * Used by the impact line on cards/report pages and by scripts/og-cards.ts.
 */

const METRIC = new RegExp(
  [
    /\d{1,2}:\d{2}(?::\d{2})?(?:\s?UTC)?/.source, // clock times: 17:57 UTC
    /\$[\d,.]+(?:\s?(?:million|billion|k|M|B))?/.source, // money
    /\b\d[\d,.]*(?:\s?(?:%|ms|min(?:ute)?s?|h(?:ours?)?|hrs?|sec(?:ond)?s?|days?|weeks?|months?|TB|GB|PB|million|billion|thousand))?\b/.source,
  ].join('|'),
  'gi',
)

export interface Segment {
  text: string
  metric: boolean
}

export function splitMetrics(text: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(METRIC)) {
    const value = m[0]
    // Bare years read as dates, not damage — leave them plain
    if (/^(19|20)\d{2}$/.test(value)) continue
    if (m.index > last) out.push({ text: text.slice(last, m.index), metric: false })
    out.push({ text: value, metric: true })
    last = m.index + value.length
  }
  if (last < text.length) out.push({ text: text.slice(last), metric: false })
  return out
}
