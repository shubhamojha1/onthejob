import { Link } from 'react-router-dom'
import { FAILURE_CLASSES } from '../../content/taxonomy'
import type { Incident } from '../schema/incident'

interface Props {
  incident: Incident
  open: boolean
  onToggleOpen: () => void
  onTag: (tag: string) => void
}

export function Card({ incident: i, open, onToggleOpen, onTag }: Props) {
  const primary = FAILURE_CLASSES[i.classes[0]]
  return (
    <article className="oj-card" style={{ '--spine': primary.color } as React.CSSProperties}>
      <div className="oj-spine" />
      <div className="oj-card-body">
        <div className="oj-card-head">
          <span className="oj-company">{i.company}</span>
          <span className="oj-meta">
            <span>{i.year}</span>
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
          {i.classes.map(c => (
            <button
              key={c}
              className="oj-chip"
              style={{ '--c': FAILURE_CLASSES[c].color } as React.CSSProperties}
              onClick={() => onTag(c)}
              title={`Filter by ${FAILURE_CLASSES[c].label}`}
            >
              {FAILURE_CLASSES[c].label}
            </button>
          ))}
        </div>

        <p className="oj-impact">{i.impact}</p>

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
                  <button key={p} className="oj-pattern" onClick={() => onTag(p)}>
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
