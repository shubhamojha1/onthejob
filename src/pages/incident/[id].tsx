import { useLoaderData, Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import type { LoaderFunctionArgs } from 'react-router-dom'
import { FAILURE_CLASSES } from '../../../content/taxonomy'
import type { Incident } from '../../schema/incident'
import allIncidents from '../../generated/incidents-all.json'
import { Masthead } from '../../components/Masthead'
import { ShareRow } from '../../components/ShareRow'
import { ImpactText } from '../../components/ImpactText'
import { UptimeStrip } from '../../components/TickStrip'

const SITE = 'https://systemsfailed.vercel.app'

export async function loader({ params }: LoaderFunctionArgs): Promise<Incident> {
  const incident = (allIncidents as Incident[]).find(i => i.id === params.id)
  if (!incident) throw new Response('Not found', { status: 404 })
  return incident
}

export function Component() {
  const i = useLoaderData() as Incident

  const ogTitle = `${i.title} — ${i.company} (${i.year})`
  const ogDesc = i.impact
  const ogImage = `${SITE}/cards/${i.id}.png`

  return (
    <div className="oj-root">
        <Head>
          <meta charSet="UTF-8" />
          <title>{`${i.title} — ${i.company} ${i.year} | systemsfailed.dev`}</title>
          <meta name="description" content={i.impact} />
          <meta property="og:title" content={ogTitle} />
          <meta property="og:description" content={ogDesc} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={`${SITE}/incident/${i.id}`} />
          <meta property="og:image" content={ogImage} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ogTitle} />
          <meta name="twitter:description" content={ogDesc} />
          <meta name="twitter:image" content={ogImage} />
        </Head>

        <Masthead />

        <div className="oj-detail-page">
          <Link to="/" className="oj-back">
            ← All incidents
          </Link>

          <article className="oj-report">
            <div className="oj-report-bar">
              <span className="oj-report-kind">Incident report</span>
              {i.verified && (
                <span className="oj-verified-badge">source verified</span>
              )}
            </div>

            <div className="oj-report-body">
              <div className="oj-incident-company">
                <span>{i.company}</span>
                <span className="oj-sep">/</span>
                <span>{i.date}</span>
                <span className="oj-sep">/</span>
                <span>{i.duration}</span>
              </div>

              <h1 className="oj-incident-title">{i.title}</h1>

              <div className="oj-chips" style={{ marginBottom: 22 }}>
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

              {/* The year this incident owned, as an uptime strip */}
              <div className="oj-report-strip">
                <UptimeStrip incident={i} ticks={48} large />
                <div className="oj-report-strip-legend">
                  <span>Jan {i.year}</span>
                  <span>Dec {i.year}</span>
                </div>
              </div>

              <p className="oj-incident-impact"><ImpactText text={i.impact} /></p>

              <div className="oj-incident-lesson">
                <span className="oj-lesson-tag">Lesson</span>
                <p>{i.lesson}</p>
              </div>

              <Section label="Trigger" body={i.trigger} />
              <Section label="Mechanism" body={i.mechanism} />
              <Section label="Interview lens" body={i.interview} accent />

              <div className="oj-section" style={{ marginTop: 26 }}>
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

              <ShareRow incident={i} />

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
                    style={{ marginBottom: 0 }}
                  >
                    Archive copy
                  </a>
                )}
              </div>
            </div>
          </article>
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
