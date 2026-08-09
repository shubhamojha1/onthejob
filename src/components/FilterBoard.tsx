import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FAILURE_CLASSES, FAILURE_CLASS_KEYS, colorForCompany } from '../../content/taxonomy'
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
  const [dropdownOpen, setDropdownOpen] = useState(active.size > 0)

  interface Tile { key: string; label: string; count: number; color: string; desc?: string }

  const classes: Tile[] = useMemo(
    () =>
      FAILURE_CLASS_KEYS.map(key => ({
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
        <span className="oj-board-hint">
          {mode === 'class' ? 'select to filter · or browse the full class' : 'select to filter the record'}
        </span>
      </div>
      <details
        className="oj-filter-dropdown"
        open={dropdownOpen}
        onToggle={event => setDropdownOpen(event.currentTarget.open)}
      >
        <summary>
          <h2 className="oj-filter-dropdown-label">
            {mode === 'company' ? 'Companies' : 'Failure classes'}
          </h2>
        </summary>
        <div className="oj-filter-list">
        {tiles.map(t => {
          const on = active.has(t.key)
          return (
            <div
              key={t.key}
              className={'oj-filter-row-shell' + (mode === 'class' ? ' has-page' : '')}
              style={{ '--c': t.color } as React.CSSProperties}
            >
              <button
                className={'oj-filter-row' + (on ? ' on' : '')}
                aria-pressed={on}
                onClick={() => onToggle(t.key)}
              >
                <span className="oj-filter-row-main">
                  {mode === 'company' ? <CompanyMark company={t.key} /> : <span className="oj-swatch" />}
                    <span className="oj-filter-row-label">{t.label}</span>
                    <span className="oj-filter-row-count">{t.count}</span>
                  </span>
                  {t.desc && <span className="oj-filter-row-desc">{t.desc}</span>}
              </button>
              {mode === 'class' && (
                <Link
                    className="oj-filter-row-page"
                  to={`/class/${t.key}`}
                  aria-label={`Browse all ${t.label} incidents`}
                >
                  Browse incidents <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          )
        })}
        </div>
      </details>
    </section>
  )
}
