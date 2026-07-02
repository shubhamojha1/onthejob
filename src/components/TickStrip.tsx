import { Link } from 'react-router-dom'
import type { Incident } from '../schema/incident'

/** How many ticks a single incident's red segment spans, from its duration text. */
export function severityTicks(duration: string): number {
  const d = duration.toLowerCase()
  if (/\d+\s*(day|week|month)/.test(d)) return 3
  const h = d.match(/(\d+(?:\.\d+)?)\s*h/)
  if (h && parseFloat(h[1]) >= 3) return 2
  return 1
}

/** Tick index for a date within a year-long strip. */
function yearPosition(date: string, ticks: number): number {
  const [, m, day] = date.split('-').map(Number)
  const dayOfYear = (m - 1) * 30.4 + (day || 1)
  return Math.min(ticks - 1, Math.round((dayOfYear / 365) * ticks))
}

interface StripProps {
  incident: Incident
  ticks?: number
  large?: boolean
}

/**
 * The signature mark: a one-year uptime strip, green except for the days
 * this incident owned. Red segment position = when in the year it hit,
 * length = how long it lasted.
 */
export function UptimeStrip({ incident, ticks = 36, large }: StripProps) {
  const start = yearPosition(incident.date, ticks)
  const len = severityTicks(incident.duration)
  return (
    <div
      className={'oj-ustrip' + (large ? ' oj-ustrip-lg' : '')}
      role="img"
      aria-label={`${incident.company} outage, ${incident.date}, ${incident.duration}`}
      title={`${incident.date} · ${incident.duration}`}
    >
      {Array.from({ length: ticks }, (_, i) => (
        <i key={i} className={i >= start && i < start + len ? 'hit' : undefined} />
      ))}
    </div>
  )
}

const TICKS_PER_YEAR = 8

/**
 * The hero strip: one continuous uptime bar from the earliest incident year
 * to the latest. Every red tick is a real outage — hover names it, clicking
 * opens the report.
 */
export function MasterStrip({ incidents }: { incidents: Incident[] }) {
  const years = incidents.map(i => i.year)
  const yearMin = Math.min(...years)
  const yearMax = Math.max(...years)
  const total = (yearMax - yearMin + 1) * TICKS_PER_YEAR

  // Bucket incidents into ticks by date
  const buckets = new Map<number, Incident[]>()
  for (const i of incidents) {
    const [y, m] = i.date.split('-').map(Number)
    const idx = Math.min(
      total - 1,
      (y - yearMin) * TICKS_PER_YEAR + Math.floor(((m - 1) / 12) * TICKS_PER_YEAR),
    )
    buckets.set(idx, [...(buckets.get(idx) ?? []), i])
  }

  return (
    <section className="oj-master" aria-label="Incident timeline">
      <div className="oj-master-strip">
        {Array.from({ length: total }, (_, idx) => {
          const hits = buckets.get(idx)
          if (!hits) return <span key={idx} className="oj-mtick" />
          const first = hits[0]
          const label = hits.map(h => `${h.company} ${h.year}`).join(' · ')
          return (
            <Link
              key={idx}
              to={`/incident/${first.id}`}
              className="oj-mtick"
              title={label}
              aria-label={label}
            />
          )
        })}
      </div>
      <div className="oj-master-legend">
        <span>{yearMin}</span>
        <b>every red tick is a real outage — click one</b>
        <span>{yearMax}</span>
      </div>
    </section>
  )
}
