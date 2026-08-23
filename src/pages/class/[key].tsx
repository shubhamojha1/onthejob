import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import type { LoaderFunctionArgs } from 'react-router-dom'
import { FAILURE_CLASSES, FAILURE_CLASS_KEYS, isFailureClassKey } from '../../../content/taxonomy'
import type { FailureClassKey } from '../../../content/taxonomy'
import type { Incident } from '../../schema/incident'
import incidentsData from '../../generated/incidents-index.json'
import { Masthead } from '../../components/Masthead'
import { Card } from '../../components/Card'
import { SITE_URL as SITE } from '../../lib/site'

interface ClassPageData {
  key: FailureClassKey
  incidents: Incident[]
}

export async function loader({ params }: LoaderFunctionArgs): Promise<ClassPageData> {
  const { key } = params
  if (!isFailureClassKey(key)) throw new Response('Not found', { status: 404 })
  return {
    key,
    incidents: (incidentsData as Incident[]).filter(i => i.classes.includes(key)),
  }
}

export function Component() {
  const { key, incidents } = useLoaderData() as ClassPageData
  const meta = FAILURE_CLASSES[key]
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const n = incidents.length
  const title = `${meta.label} — ${n} real ${n === 1 ? 'incident' : 'incidents'}`
  const desc = `${meta.desc} ${n} public ${n === 1 ? 'postmortem' : 'postmortems'} in the archive broke this way.`

  // Pattern tags have no page yet, so they fall back to the home feed's filter.
  function onPattern(pattern: string) {
    navigate(`/?pattern=${pattern}`)
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.label,
    description: desc,
    url: `${SITE}/class/${key}`,
    image: `${SITE}/cards/class-${key}.png`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Systems Failed',
      url: SITE,
    },
    numberOfItems: incidents.length,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: incidents.length,
      itemListElement: incidents.map((inc, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE}/incident/${inc.id}`,
        name: `${inc.company} — ${inc.title} (${inc.year})`,
      })),
    },
  }

  return (
    <div className="oj-root">
      <Head>
        <meta charSet="UTF-8" />
        <title>{`${title} | systemsfailed.dev`}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE}/class/${key}`} />
        <meta property="og:image" content={`${SITE}/cards/class-${key}.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={`${SITE}/cards/class-${key}.png`} />
      </Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Masthead />

      <main className="oj-class-page">
        <Link to="/" className="oj-back">← All incidents</Link>

        <header className="oj-class-head" style={{ '--c': meta.color } as React.CSSProperties}>
          <p className="oj-section-kicker"><i aria-hidden /> Failure class</p>
          <h1>{meta.label}</h1>
          <p className="oj-class-desc">{meta.desc}</p>
          <p className="oj-class-count">
            {incidents.length} {incidents.length === 1 ? 'incident' : 'incidents'} on record
          </p>
        </header>

        <div className="oj-feed">
          {incidents.map(incident => (
            <div key={incident.id} style={{ paddingBottom: 12 }}>
              <Card
                incident={incident}
                open={expanded.has(incident.id)}
                onToggleOpen={() => setExpanded(prev => {
                  const next = new Set(prev)
                  next.has(incident.id) ? next.delete(incident.id) : next.add(incident.id)
                  return next
                })}
                onPattern={onPattern}
                linkClasses
              />
            </div>
          ))}
        </div>

        <nav className="oj-class-nav" aria-label="Other failure classes">
          <p className="oj-section-kicker">Other failure classes</p>
          <div>
            {FAILURE_CLASS_KEYS
              .filter(k => k !== key)
              .map(k => (
                <Link
                  key={k}
                  to={`/class/${k}`}
                  style={{ '--c': FAILURE_CLASSES[k].color } as React.CSSProperties}
                >
                  <i aria-hidden />
                  {FAILURE_CLASSES[k].label}
                </Link>
              ))}
          </div>
        </nav>
      </main>
    </div>
  )
}
