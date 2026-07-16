import { useLoaderData, useSearchParams } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Head } from 'vite-react-ssg'
import { FilterBoard } from '../components/FilterBoard'
import { Card } from '../components/Card'
import { Toolbar } from '../components/Toolbar'
import { Masthead } from '../components/Masthead'
import { Intro } from '../components/Intro'
import { MasterStrip } from '../components/TickStrip'
import { getSearchIndex, searchIds } from '../lib/search'
import { FAILURE_CLASSES } from '../../content/taxonomy'
import { SITE_SHARE_HREF } from '../lib/site'
import type { Incident } from '../schema/incident'
import incidentsData from '../generated/incidents-index.json'
import type MiniSearch from 'minisearch'

export function loader() {
  return incidentsData as Incident[]
}

export function Component() {
  const incidents = useLoaderData() as Incident[]
  const [searchParams] = useSearchParams()
  const years = incidents.map(incident => incident.year)
  const yearMin = Math.min(...years)
  const yearMax = Math.max(...years)
  const latestIncident = [...incidents].sort((a, b) => b.date.localeCompare(a.date))[0]

  const [active, setActive] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    const cls = searchParams.get('class')
    const pat = searchParams.get('pattern')
    const co = searchParams.get('company')
    if (cls) initial.add(cls)
    if (pat) initial.add(pat)
    if (co) initial.add(co)
    return initial
  })
  // Deep links into a company should open the board on the company tab
  const initialBoardMode = searchParams.get('company') ? 'company' : searchParams.get('class') ? 'class' : 'company'
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState<'year' | 'az'>('year')
  // How many incidents the unfiltered feed shows; filters/search always show all matches
  const [limit, setLimit]   = useState<number | 'all'>(10)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [searchIndex, setSearchIndex] = useState<MiniSearch | null>(null)

  // Load search index asynchronously — only runs in the browser
  useEffect(() => {
    getSearchIndex().then(setSearchIndex).catch(console.error)
  }, [])

  // Restore the user's feed-size choice after mount (SSG markup uses the default)
  useEffect(() => {
    const saved = localStorage.getItem('sf-feed-limit')
    if (saved === 'all') setLimit('all')
    else if (saved && !Number.isNaN(+saved)) setLimit(+saved)
  }, [])

  function changeLimit(next: number | 'all') {
    setLimit(next)
    try { localStorage.setItem('sf-feed-limit', String(next)) } catch { /* private mode */ }
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  // Scroll to the first matching card when a company/failure-class tile is switched on
  const scrollToFeedRef = useRef(false)
  function toggleFilter(key: string) {
    scrollToFeedRef.current = !active.has(key)
    toggle(setActive, key)
  }

  const results = useMemo(() => {
    const q = query.trim()
    const matchIds = q && searchIndex ? searchIds(searchIndex, q) : null

    let list = incidents.filter(i => {
      if (active.size > 0) {
        const tags = [...i.classes, ...i.patterns, i.company]
        if (![...active].some(a => tags.includes(a))) return false
      }
      if (q) {
        if (matchIds) {
          if (!matchIds.has(i.id)) return false
        } else {
          // Fallback: simple search while MiniSearch loads
          const hay = [
            i.company, i.title, i.impact, i.lesson,
            ...i.classes, ...i.patterns,
          ].join(' ').toLowerCase()
          if (!hay.includes(q.toLowerCase())) return false
        }
      }
      return true
    })

    return list.sort((a, b) =>
      sort === 'year' ? b.year - a.year : a.company.localeCompare(b.company)
    )
  }, [incidents, active, query, sort, searchIndex])

  // The default (unfiltered, unsearched) view is capped to the latest k.
  // "Latest" means most recent by date regardless of the display sort,
  // so the k newest are picked first and then ordered per the sort choice.
  const isDefaultView = active.size === 0 && query.trim() === ''
  const capped = isDefaultView && limit !== 'all' && results.length > limit
  const visible = useMemo(() => {
    if (!capped) return results
    const newest = [...results]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit as number)
    const keep = new Set(newest.map(i => i.id))
    return results.filter(i => keep.has(i.id))
  }, [results, capped, limit])

  // ── Virtualized feed ────────────────────────────────────────────────────
  const feedRef = useRef<HTMLDivElement>(null)
  const parentOffsetRef = useRef(0)

  useEffect(() => {
    parentOffsetRef.current = feedRef.current?.offsetTop ?? 0
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: visible.length,
    estimateSize: () => 244,
    overscan: 4,
    scrollMargin: parentOffsetRef.current,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Runs after the filtered feed has re-rendered, so the first card's
  // position is already correct before we scroll to it
  useEffect(() => {
    if (!scrollToFeedRef.current) return
    scrollToFeedRef.current = false
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const top = feedRef.current?.getBoundingClientRect().top ?? 0
    window.scrollTo({ top: window.scrollY + top - 18, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [results])

  return (
    <div className="oj-root">
        <Head>
          <meta charSet="UTF-8" />
          <title>Systems Failed — Failure intelligence for engineers</title>
          <meta name="description" content="Real engineering incidents indexed by how the system broke. Trace the trigger, cascade, impact, and transferable lesson." />
          <meta property="og:title" content="Production breaks. The pattern repeats." />
          <meta property="og:description" content="Explore real engineering postmortems by failure mode — not by company." />
          <meta property="og:site_name" content="Systems Failed" />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="https://www.systemsfailed.dev/og-image.png" />
          <meta property="og:url" content="https://www.systemsfailed.dev" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Production breaks. The pattern repeats." />
          <meta name="twitter:description" content="Explore real engineering postmortems by failure mode — not by company." />
          <meta name="twitter:image" content="https://www.systemsfailed.dev/og-image.png" />
          <meta name="twitter:creator" content="@claudeabuser" />
        </Head>

        <Intro incidentCount={incidents.length} />
        <Masthead />

        {/* Hero */}
        <section className="oj-hero">
          <div className="oj-hero-copy">
            <p className="oj-eyebrow">Failure intelligence for engineers</p>
            <h1 className="oj-h1">
              Production breaks.<br />
              <em>The pattern repeats.</em>
            </h1>
            <p className="oj-lede">
              A field guide to real engineering incidents, indexed by{' '}
              <strong>how the system broke</strong> — not by who had the outage.
              Trace the trigger, the cascade, and the lesson before it repeats on your watch.
            </p>
            <div className="oj-hero-actions">
              <a className="oj-primary-action" href="#archive">
                Explore the archive <span aria-hidden>↓</span>
              </a>
              <a className="oj-secondary-action" href={SITE_SHARE_HREF} target="_blank" rel="noreferrer">
                Share on X <span aria-hidden>↗</span>
              </a>
            </div>
            <div className="oj-hero-stats" aria-label="Archive statistics">
              <div><strong>{incidents.length}</strong><span>incident reports</span></div>
              <div><strong>{Object.keys(FAILURE_CLASSES).length}</strong><span>failure classes</span></div>
              <div><strong>{yearMin}–{yearMax}</strong><span>years on record</span></div>
            </div>
          </div>

          <aside className="oj-signal-card" aria-label="How to read an incident">
            <div className="oj-signal-topbar">
              <span><i /> Archive signal</span>
              <span>Permanent record</span>
            </div>
            <div className="oj-signal-body">
              <div className="oj-signal-heading">
                <span>Latest case file</span>
                <b>{latestIncident.date}</b>
              </div>
              <h2>{latestIncident.company}</h2>
              <p>{latestIncident.title}</p>
              <div className="oj-signal-steps">
                <span><b>01</b> Trigger</span>
                <span><b>02</b> Mechanism</span>
                <span><b>03</b> Impact</span>
                <span><b>04</b> Lesson</span>
              </div>
              <a href={`/incident/${latestIncident.id}`}>
                Open the latest report <span aria-hidden>→</span>
              </a>
            </div>
          </aside>
        </section>

        {/* Master timeline strip */}
        <MasterStrip incidents={incidents} />

        <section className="oj-archive" id="archive">
          <div className="oj-archive-intro">
            <div>
              <p className="oj-section-kicker">Browse the archive</p>
              <h2>Start with who broke, or how.</h2>
            </div>
            <p>
              Select one or more signals to cut through the record. Every case links back
              to the original public postmortem.
            </p>
          </div>

          {/* Filter board: companies or failure classes */}
          <FilterBoard
            incidents={incidents}
            active={active}
            onToggle={toggleFilter}
            initialMode={initialBoardMode}
          />
        </section>

        {/* Toolbar + active pills */}
        <Toolbar
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          count={visible.length}
          total={capped ? results.length : undefined}
          limit={limit}
          onLimit={changeLimit}
          showLimit={isDefaultView}
          active={active}
          onRemoveFilter={tag => toggle(setActive, tag)}
          onClearAll={() => setActive(new Set())}
        />

        {/* Virtualized feed */}
        <main className="oj-feed" ref={feedRef}>
          {visible.length === 0 ? (
            <div className="oj-empty">
              <p>No incidents match that filter yet.</p>
              <button onClick={() => { setActive(new Set()); setQuery('') }}>Reset</button>
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualItems.map(vItem => {
                const incident = visible[vItem.index]
                return (
                  <div
                    key={vItem.key}
                    data-index={vItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${vItem.start - virtualizer.options.scrollMargin}px)`,
                      paddingBottom: 12,
                    }}
                  >
                    <Card
                      incident={incident}
                      open={expanded.has(incident.id)}
                      onToggleOpen={() => toggle(setExpanded, incident.id)}
                      onTag={t => toggle(setActive, t)}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {capped && (
            <div className="oj-showall">
              <button onClick={() => changeLimit('all')}>
                Show all {results.length} incidents
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="oj-footer">
          <div className="oj-footer-callout">
            <div>
              <span className="oj-section-kicker">The archive is never finished</span>
              <h2>Know a failure worth remembering?</h2>
            </div>
            <a href="https://x.com/claudeabuser" target="_blank" rel="noreferrer">
              Send it my way <span aria-hidden>↗</span>
            </a>
          </div>
          <p className="oj-footer-note">
            A seed set, growing. Built on the shoulders of the public postmortem community —
            Dan Luu's{' '}
            <a href="https://github.com/danluu/post-mortems" target="_blank" rel="noreferrer">
              post-mortems
            </a>
            , the{' '}
            <a href="https://k8s.af" target="_blank" rel="noreferrer">
              k8s failure stories
            </a>
            , and Lorin Hochstein's incident list. The difference here is the taxonomy:
            failure class first, company second.
          </p>
          <p className="oj-foot-by">
            Built by{' '}
            <a href="https://shubham-ojha.com" target="_blank" rel="noreferrer">Shubham Ojha</a>
            {' '}·{' '}
            <a href="https://x.com/claudeabuser" target="_blank" rel="noreferrer">@claudeabuser</a>
            {' '}·{' '}
            <a href="https://www.linkedin.com/in/shubhamojha1/" target="_blank" rel="noreferrer">LinkedIn</a>
          </p>
        </footer>
      </div>
  )
}
