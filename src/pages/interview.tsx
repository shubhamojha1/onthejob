import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import interviewEntries from '../generated/interview-index.json'
import { buildInterviewGuide } from '../features/interview/guide'
import type { InterviewIndexEntry } from '../schema/incident'
import { Masthead } from '../components/Masthead'

const SITE = 'https://www.systemsfailed.dev'
const TITLE = 'Interview prep — system design lessons from real outages'
const DESC =
  'Browse concise system design talking points grounded in real engineering incidents, organized by failure mode.'
// Generated exclusively from schema-validated incidents in scripts/build-index.ts.
const entries = interviewEntries as InterviewIndexEntry[]

export function Component() {
  const [query, setQuery] = useState('')
  const allGuide = useMemo(() => buildInterviewGuide(entries), [])
  const guide = useMemo(() => buildInterviewGuide(entries, query), [query])
  const { groups, incidentCount: matchCount } = guide

  function jumpToTopic(key: string) {
    setQuery('')
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.getElementById(`topic-${key}`)
      if (!target) return
      window.history.replaceState(null, '', `#topic-${key}`)
      target.focus({ preventScroll: true })
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    }))
  }

  return (
    <div className="oj-root">
      <Head>
        <meta charSet="UTF-8" />
        <title>{`${TITLE} | systemsfailed.dev`}</title>
        <meta name="description" content={DESC} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE}/interview`} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESC} />
        <meta name="twitter:image" content={`${SITE}/og-image.png`} />
      </Head>

      <Masthead />

      <main className="oj-interview-page">
        <Link to="/" className="oj-back">← All incidents</Link>

        <header className="oj-iv-hero">
          <div className="oj-iv-hero-copy">
            <p className="oj-section-kicker">Interview field guide</p>
            <h1>Build stronger answers from real failures.</h1>
            <p>
              Use concise lessons from public postmortems to explain tradeoffs, failure
              modes, and safeguards in a system design interview. Each incident appears
              under every topic it can help you discuss.
            </p>
          </div>

          <dl className="oj-iv-stats" aria-label="Guide statistics">
            <div>
              <dt>Incidents</dt>
              <dd>{entries.length}</dd>
            </div>
            <div>
              <dt>Failure topics</dt>
              <dd>{allGuide.groups.length}</dd>
            </div>
          </dl>
        </header>

        <section className="oj-iv-browser" aria-labelledby="browse-interview-guide">
          <div className="oj-iv-browser-head">
            <div>
              <p className="oj-section-kicker">Find a talking point</p>
              <h2 id="browse-interview-guide">Browse by failure mode</h2>
              <p>Jump to a topic or search by technology, company, incident, or lesson.</p>
            </div>

            <label className="oj-iv-search">
              <span>Search the guide</span>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="e.g. retries, DNS, GitHub…"
              />
            </label>
          </div>

          <nav className="oj-iv-topic-index" aria-label="Interview topics">
            {allGuide.groups.map(group => (
              <a
                key={group.key}
                href={`#topic-${group.key}`}
                style={{ '--c': group.color } as React.CSSProperties}
                onClick={event => {
                  event.preventDefault()
                  jumpToTopic(group.key)
                }}
              >
                <i aria-hidden />
                <span>{group.label}</span>
                <b>{group.items.length}</b>
              </a>
            ))}
          </nav>
        </section>

        <div className="oj-iv-results-head" aria-live="polite">
          <p>
            {query.trim()
              ? `${matchCount} ${matchCount === 1 ? 'incident' : 'incidents'} across ${groups.length} ${groups.length === 1 ? 'topic' : 'topics'}`
              : 'All interview topics'}
          </p>
          {query && <button type="button" onClick={() => setQuery('')}>Clear search</button>}
        </div>

        {groups.length === 0 ? (
          <div className="oj-iv-empty">
            <h2>No matching lessons</h2>
            <p>Try a company, technology, failure mode, or engineering concept.</p>
            <button type="button" onClick={() => setQuery('')}>Show every topic</button>
          </div>
        ) : (
          <div className="oj-iv-groups">
            {groups.map(group => (
              <section
                key={group.key}
                id={`topic-${group.key}`}
                className="oj-iv-group"
                tabIndex={-1}
                style={{ '--c': group.color } as React.CSSProperties}
              >
                <header className="oj-iv-group-head">
                  <div>
                    <p className="oj-iv-topic-label"><i aria-hidden /> Failure mode</p>
                    <h2>{group.label}</h2>
                  </div>
                  <span>{group.items.length} {group.items.length === 1 ? 'case' : 'cases'}</span>
                  <p>{group.description}</p>
                </header>

                <ul className="oj-iv-list">
                  {group.items.map(entry => (
                    <li key={entry.id} className="oj-iv-item">
                      <p className="oj-iv-line">{entry.interview}</p>
                      <Link to={`/incident/${entry.id}`} className="oj-iv-source">
                        <span>{entry.company} · {entry.year}</span>
                        <strong>{entry.title}</strong>
                        <i aria-hidden>→</i>
                      </Link>
                    </li>
                  ))}
                </ul>

                <a className="oj-iv-top-link" href="#browse-interview-guide">Back to topics ↑</a>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
