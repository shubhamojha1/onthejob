import { Link } from 'react-router-dom'
import { FAILURE_CLASSES } from '../../content/taxonomy'
import { UptimeStrip } from './TickStrip'
import { ImpactText } from './ImpactText'
import type { Incident } from '../schema/incident'
import type { FailureClassKey } from '../../content/taxonomy'

interface SharedProps {
  incident: Incident
  open: boolean
  onToggleOpen: () => void
  onPattern: (pattern: string) => void
}

type Props = SharedProps & (
  | { linkClasses: true }
  | { linkClasses?: false; onClass: (classKey: FailureClassKey) => void }
)

export function Card(props: Props) {
  const { incident: i, open, onToggleOpen, onPattern } = props

  return (
    <article className="oj-card">
      <div className="oj-card-body">
        <UptimeStrip incident={i} />
        <div className="oj-card-head">
          <span className="oj-company">{i.company}</span>
          <span className="oj-meta">
            <span>{i.date}</span>
            <span className="oj-sep">/</span>
            <span className="oj-dur">{i.duration}</span>
          </span>
        </div>

        <h2 className="oj-title">
          <Link
            to={`/incident/${i.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {i.title}
          </Link>
        </h2>

        <div className="oj-chips">
          {i.classes.map(c => {
            const meta = FAILURE_CLASSES[c]
            const style = { '--c': meta.color } as React.CSSProperties

            return props.linkClasses ? (
              <Link
                key={c}
                to={`/class/${c}`}
                className="oj-chip"
                style={style}
                title={`Browse ${meta.label} incidents`}
              >
                {meta.label}
              </Link>
            ) : (
              <button
                key={c}
                className="oj-chip"
                style={style}
                onClick={() => props.onClass(c)}
                title={`Filter by ${meta.label}`}
              >
                {meta.label}
              </button>
            )
          })}
        </div>

        <p className="oj-impact"><ImpactText text={i.impact} /></p>

        <div className="oj-lesson">
          <span className="oj-lesson-tag">Lesson</span>
          <p>{i.lesson}</p>
        </div>

        {open && (
          <div className="oj-detail">
            <Row label="Trigger" body={i.trigger} />
            <Row label="Mechanism" body={i.mechanism} />
            <Row label="Interview lens" body={i.interview} accent />
            <div className="oj-patterns">
              <span className="oj-detail-label">Recurring patterns</span>
              <div className="oj-pattern-tags">
                {i.patterns.map(p => (
                  <button key={p} className="oj-pattern" onClick={() => onPattern(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="oj-card-foot">
          <button className="oj-expand" onClick={onToggleOpen} aria-expanded={open}>
            {open ? 'Hide detail' : 'Show detail'}
            <span className={'oj-caret' + (open ? ' up' : '')}>▾</span>
          </button>
          <a className="oj-source" href={i.source} target="_blank" rel="noreferrer">
            Read the postmortem <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </article>
  )
}

function Row({ label, body, accent }: { label: string; body: string; accent?: boolean }) {
  return (
    <div className={'oj-row' + (accent ? ' accent' : '')}>
      <span className="oj-detail-label">{label}</span>
      <p>{body}</p>
    </div>
  )
}
