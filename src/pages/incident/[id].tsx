import { useLoaderData, Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import type { LoaderFunctionArgs } from 'react-router-dom'
import { FAILURE_CLASSES } from '../../../content/taxonomy'
import type { Incident } from '../../schema/incident'
import allIncidents from '../../generated/incidents-all.json'

export async function loader({ params }: LoaderFunctionArgs): Promise<Incident> {
  const incident = (allIncidents as Incident[]).find(i => i.id === params.id)
  if (!incident) throw new Response('Not found', { status: 404 })
  return incident
}

export function Component() {
  const i = useLoaderData() as Incident
  const primary = FAILURE_CLASSES[i.classes[0]]

  const ogTitle = `${i.title} — ${i.company} (${i.year})`
  const ogDesc = i.impact

  return (
    <div className="oj-root">
        <Head>
          <meta charSet="UTF-8" />
          <title>{`${i.title} — ${i.company} ${i.year} | systemsfailed.dev`}</title>
          <meta name="description" content={i.impact} />
          <meta property="og:title" content={ogTitle} />
          <meta property="og:description" content={ogDesc} />
          <meta property="og:type" content="article" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={ogTitle} />
          <meta name="twitter:description" content={ogDesc} />
        </Head>

        {/* Masthead */}
        <header className="oj-mast">
          <a href="/" className="oj-wordmark">systemsfailed<span>.dev</span></a>
        </header>

        <div className="oj-detail-page">
          {/* Back link */}
          <Link to="/" className="oj-back">
            ← All incidents
          </Link>

          {/* Incident header */}
          <div className="oj-incident-head">
            <div className="oj-incident-company">
              <span>{i.company}</span>
              <span className="oj-sep">/</span>
              <span>{i.year}</span>
              <span className="oj-sep">/</span>
              <span>{i.duration}</span>
              {i.verified && (
                <span className="oj-verified-badge">source verified</span>
              )}
            </div>

            <h1 className="oj-incident-title" style={{ color: primary.color }}>
              {i.title}
            </h1>

            {/* Class chips */}
            <div className="oj-chips" style={{ marginBottom: 20 }}>
              {i.classes.map(c => (
                <Link
                  key={c}
                  to={`/?class=${c}`}
                  className="oj-chip"
                  style={{ '--c': FAILURE_CLASSES[c].color, textDecoration: 'none' } as React.CSSProperties}
                >
                  {FAILURE_CLASSES[c].label}
                </Link>
              ))}
            </div>

            <p className="oj-incident-impact">{i.impact}</p>
          </div>

          {/* Lesson */}
          <div className="oj-incident-lesson">
            <span className="oj-lesson-tag">Lesson</span>
            <p>{i.lesson}</p>
          </div>

          {/* Timeline */}
          <Section label="Trigger" body={i.trigger} />
          <Section label="Mechanism" body={i.mechanism} />
          <Section label="Interview lens" body={i.interview} accent />

          {/* Patterns */}
          <div className="oj-section" style={{ marginTop: 28 }}>
            <div className="oj-section-label">Recurring patterns</div>
            <div className="oj-pattern-tags" style={{ marginTop: 8 }}>
              {i.patterns.map(p => (
                <Link
                  key={p}
                  to={`/?pattern=${p}`}
                  className="oj-pattern"
                  style={{ textDecoration: 'none' }}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="oj-incident-footer">
            <a
              className="oj-source"
              href={i.source}
              target="_blank"
              rel="noreferrer"
            >
              Read the original postmortem →
            </a>
            {i.archive_url && (
              <a
                className="oj-back"
                href={i.archive_url}
                target="_blank"
                rel="noreferrer"
              >
                Archive copy
              </a>
            )}
          </div>
        </div>
      </div>
  )
}

function Section({
  label,
  body,
  accent,
}: {
  label: string
  body: string
  accent?: boolean
}) {
  return (
    <div className={'oj-section' + (accent ? ' accent' : '')}>
      <div className="oj-section-label">{label}</div>
      <p className="oj-section-body">{body}</p>
    </div>
  )
}
