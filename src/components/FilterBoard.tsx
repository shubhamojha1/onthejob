import { useMemo, useState } from 'react'
import { FAILURE_CLASSES, colorForCompany, type FailureClassKey } from '../../content/taxonomy'
import { CompanyMark } from './CompanyMark'
import type { Incident } from '../schema/incident'

type Mode = 'company' | 'class'

interface Props {
  incidents: Incident[]
  active: Set<string>
  onToggle: (key: string) => void
  initialMode?: Mode
}

/** The filter surface: toggle between browsing by company or by failure class. */
export function FilterBoard({ incidents, active, onToggle, initialMode = 'company' }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode)

  interface Tile { key: string; label: string; count: number; color: string; desc?: string }

  const classes: Tile[] = useMemo(
    () =>
      (Object.keys(FAILURE_CLASSES) as FailureClassKey[]).map(key => ({
        key,
        label: FAILURE_CLASSES[key].label,
        desc: FAILURE_CLASSES[key].desc,
        color: FAILURE_CLASSES[key].color,
        count: incidents.filter(i => i.classes.includes(key)).length,
      })),
    [incidents],
  )

  const companies: Tile[] = useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of incidents) counts.set(i.company, (counts.get(i.company) ?? 0) + 1)
    return [...counts.entries()]
      .map(([company, count]) => ({ key: company, label: company, count, color: colorForCompany(company) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [incidents])

  const tiles = mode === 'company' ? companies : classes

  return (
    <section className="oj-board" aria-label="Filter the record">
      <div className="oj-board-hd">
        <div className="oj-board-hd-left">
          <h2 className="oj-board-eyebrow">{mode === 'company' ? 'Companies' : 'Failure classes'}</h2>
          <div className="oj-filtermode" role="tablist" aria-label="Browse by">
            <button
              role="tab"
              aria-selected={mode === 'company'}
              className={mode === 'company' ? 'on' : ''}
              onClick={() => setMode('company')}
            >
              Companies
            </button>
            <button
              role="tab"
              aria-selected={mode === 'class'}
              className={mode === 'class' ? 'on' : ''}
              onClick={() => setMode('class')}
            >
              Failure classes
            </button>
          </div>
        </div>
        <span className="oj-board-hint">select to filter the record</span>
      </div>
      <div className="oj-board-grid">
        {tiles.map(t => {
          const on = active.has(t.key)
          return (
            <button
              key={t.key}
              className={'oj-tile' + (on ? ' on' : '')}
              style={{ '--c': t.color } as React.CSSProperties}
              aria-pressed={on}
              onClick={() => onToggle(t.key)}
            >
              <span className="oj-tile-top">
                {mode === 'company' ? <CompanyMark company={t.key} /> : <span className="oj-swatch" />}
                <span className="oj-tile-label">{t.label}</span>
                <span className="oj-tile-count">{t.count}</span>
              </span>
              {t.desc && <span className="oj-tile-desc">{t.desc}</span>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
