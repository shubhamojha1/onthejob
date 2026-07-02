import { FAILURE_CLASSES, type FailureClassKey } from '../../content/taxonomy'
import type { Incident } from '../schema/incident'

interface Props {
  incidents: Incident[]
  active: Set<string>
  onToggle: (key: string) => void
}

/** Failure classes styled as the components list of a status page. */
export function FailureBoard({ incidents, active, onToggle }: Props) {
  const classes = (Object.keys(FAILURE_CLASSES) as FailureClassKey[]).map(key => {
    const count = incidents.filter(i => i.classes.includes(key)).length
    return { key, count, ...FAILURE_CLASSES[key] }
  })

  return (
    <section className="oj-board" aria-label="Filter by failure class">
      <div className="oj-board-hd">
        <h2 className="oj-board-eyebrow">Failure classes</h2>
        <span className="oj-board-hint">select to filter the record</span>
      </div>
      <div className="oj-board-grid">
        {classes.map(c => {
          const on = active.has(c.key)
          return (
            <button
              key={c.key}
              className={'oj-tile' + (on ? ' on' : '')}
              style={{ '--c': c.color } as React.CSSProperties}
              aria-pressed={on}
              onClick={() => onToggle(c.key)}
            >
              <span className="oj-tile-top">
                <span className="oj-swatch" />
                <span className="oj-tile-label">{c.label}</span>
                <span className="oj-tile-count">{c.count}</span>
              </span>
              <span className="oj-tile-desc">{c.desc}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
