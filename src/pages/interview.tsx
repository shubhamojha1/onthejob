import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import interviewEntries from '../generated/interview-index.json'
import { buildInterviewGuide } from '../features/interview/guide'
import type { InterviewGuideGroup } from '../features/interview/guide'
import type { InterviewIndexEntry } from '../schema/incident'
import { Masthead } from '../components/Masthead'
import { SITE_URL as SITE } from '../lib/site'
const TITLE = 'Interview prep — system design lessons from real outages'
const DESC =
  'Browse concise system design talking points grounded in real engineering incidents, organized by failure mode.'
// Generated exclusively from schema-validated incidents in scripts/build-index.ts.
const entries = interviewEntries as InterviewIndexEntry[]

export function Component() {
  const [query, setQuery] = useState('')
  const [activeCaseByTopic, setActiveCaseByTopic] = useState<Record<string, number>>({})
  const [caseAnnouncement, setCaseAnnouncement] = useState('')
  const allGuide = useMemo(() => buildInterviewGuide(entries), [])
  const guide = useMemo(() => buildInterviewGuide(entries, query), [query])
  const { groups, incidentCount: matchCount } = guide

  useEffect(() => {
    if (!window.location.hash.startsWith('#topic-')) return
    const target = document.getElementById(window.location.hash.slice(1))
    if (target?.tagName === 'DETAILS') (target as HTMLDetailsElement).open = true
  }, [])

  function updateQuery(nextQuery: string) {
    setActiveCaseByTopic({})
    setCaseAnnouncement('')
    setQuery(nextQuery)
  }

  function cycleTopicCase(group: InterviewGuideGroup, direction: -1 | 1) {
    const currentIndex = (activeCaseByTopic[group.key] ?? 0) % group.items.length
    const nextIndex = (currentIndex + direction + group.items.length) % group.items.length

    setActiveCaseByTopic(current => ({ ...current, [group.key]: nextIndex }))
    setCaseAnnouncement(
      `${group.label}, case ${nextIndex + 1} of ${group.items.length}. ${group.items[nextIndex].interview}`,
    )
  }

  function jumpToTopic(key: string) {
    updateQuery('')
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.getElementById(`topic-${key}`)
      if (!target) return
      if (target.tagName === 'DETAILS') (target as HTMLDetailsElement).open = true
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
        <meta property="og:image" content={`${SITE}/cards/interview.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESC} />
        <meta name="twitter:image" content={`${SITE}/cards/interview.png`} />
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
                onChange={event => updateQuery(event.target.value)}
                placeholder="e.g. retries, DNS, GitHub…"
              />
            </label>
          </div>

          <label className="oj-iv-topic-select">
            <span>Failure mode</span>
            <select
              defaultValue=""
              onChange={event => {
                const key = event.currentTarget.value
                if (!key) return
                jumpToTopic(key)
                event.currentTarget.value = ''
              }}
            >
              <option value="" disabled>Select a failure mode</option>
              {allGuide.groups.map(group => (
                <option key={group.key} value={group.key}>
                  {group.label} · {group.items.length} {group.items.length === 1 ? 'case' : 'cases'}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div className="oj-iv-results-head" aria-live="polite">
          <p>
            {query.trim()
              ? `${matchCount} ${matchCount === 1 ? 'incident' : 'incidents'} across ${groups.length} ${groups.length === 1 ? 'topic' : 'topics'}`
              : 'All interview topics'}
          </p>
          {query && <button type="button" onClick={() => updateQuery('')}>Clear search</button>}
        </div>

        <p className="oj-iv-case-status" aria-live="polite" aria-atomic="true">
          {caseAnnouncement}
        </p>

        {groups.length === 0 ? (
          <div className="oj-iv-empty">
            <h2>No matching lessons</h2>
            <p>Try a company, technology, failure mode, or engineering concept.</p>
            <button type="button" onClick={() => updateQuery('')}>Show every topic</button>
          </div>
        ) : (
          <div className="oj-iv-groups">
            {groups.map(group => {
              const activeIndex = (activeCaseByTopic[group.key] ?? 0) % group.items.length
              const entry = group.items[activeIndex]

              return (
                <details
                  key={group.key}
                  id={`topic-${group.key}`}
                  className="oj-iv-group"
                  tabIndex={-1}
                  open={query.trim() ? true : undefined}
                  onToggle={event => {
                    if (query.trim() && !event.currentTarget.open) event.currentTarget.open = true
                  }}
                  style={{ '--c': group.color } as React.CSSProperties}
                >
                  <summary className="oj-iv-group-head">
                    <h2>
                      <span className="oj-iv-group-title">
                        <span className="oj-iv-topic-label"><i aria-hidden /> Failure mode</span>
                        <span className="oj-iv-group-name">{group.label}</span>
                      </span>
                      <span className="oj-iv-group-count">{group.items.length} {group.items.length === 1 ? 'case' : 'cases'}</span>
                      <i className="oj-iv-group-toggle" aria-hidden />
                      <span className="oj-iv-group-description">{group.description}</span>
                    </h2>
                  </summary>

                  <div className="oj-iv-case-viewer">
                    <article
                      className="oj-iv-case"
                      aria-label={`${group.label} case ${activeIndex + 1} of ${group.items.length}`}
                    >
                      <div key={entry.id} className="oj-iv-case-content">
                        <p className="oj-iv-line">{entry.interview}</p>
                        <Link to={`/incident/${entry.id}`} className="oj-iv-source">
                          <span className="oj-iv-source-meta">{entry.company} · {entry.year}</span>
                          <strong>{entry.title}</strong>
                          <span className="oj-iv-source-action">Read full incident report</span>
                        </Link>
                      </div>
                    </article>

                    {group.items.length > 1 && (
                      <div className="oj-iv-case-controls" role="group" aria-label={`${group.label} cases`}>
                        <button
                          type="button"
                          aria-label={`Previous ${group.label} case`}
                          onClick={() => cycleTopicCase(group, -1)}
                        >
                          <span aria-hidden>←</span>
                        </button>
                        <span>{activeIndex + 1} / {group.items.length}</span>
                        <button
                          type="button"
                          aria-label={`Next ${group.label} case`}
                          onClick={() => cycleTopicCase(group, 1)}
                        >
                          <span aria-hidden>→</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <a className="oj-iv-top-link" href="#browse-interview-guide">Back to topics ↑</a>
                </details>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
