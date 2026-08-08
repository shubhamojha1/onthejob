import type { Incident } from '../schema/incident'
import { escapeXml } from './xml'

export function buildRssFeed(incidents: Incident[], siteUrl: string): string {
  const items = [...incidents]
    .sort((a, b) => b.date_added.localeCompare(a.date_added) || a.id.localeCompare(b.id))
    .slice(0, 50)
    .map(incident => `    <item>
      <title>${escapeXml(`${incident.company} — ${incident.title}`)}</title>
      <link>${siteUrl}/incident/${incident.id}</link>
      <guid isPermaLink="true">${siteUrl}/incident/${incident.id}</guid>
      <pubDate>${new Date(`${incident.date_added}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(incident.impact)}</description>
    </item>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>systemsfailed.dev</title>
    <link>${siteUrl}/</link>
    <description>Real engineering postmortems, organised by how they failed.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}
