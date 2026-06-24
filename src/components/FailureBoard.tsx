import { FAILURE_CLASSES, type FailureClassKey } from '../../content/taxonomy'
import type { Incident } from '../schema/incident'

interface Props {
  incidents: Incident[]
  active: Set<string>
  onToggle: (key: string) => void
}

export function FailureBoard({ incidents, active, onToggle }: Props) {
  const classes = (Object.keys(FAILURE_CLASSES) as FailureClassKey[]).map(key => {
    const count = incidents.filter(i => i.classes.includes(key)).length
    return { key, count, ...FAILURE_CLASSES[key] }
  })

  return (
    <section className="oj-board" aria-label="Filter by failure class">
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
              <span className="oj-tile-count">{c.count}</span>
            </span>
            <span className="oj-tile-label">{c.label}</span>
            <span className="oj-tile-desc">{c.desc}</span>
          </button>
        )
      })}
    </section>
  )
}
