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
import type { Incident } from '../schema/incident'
import incidentsData from '../generated/incidents-index.json'
import type MiniSearch from 'minisearch'

export function loader() {
  return incidentsData as Incident[]
}

export function Component() {
  const incidents = useLoaderData() as Incident[]
  const [searchParams] = useSearchParams()

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
          <title>Systems Failed</title>
          <meta name="description" content="Pick a way systems break and see who it bit, why it spread, and the transferable lesson." />
          <meta property="og:title" content="Systems Failed — Engineering postmortems by failure class" />
          <meta property="og:description" content="Pick a way systems break and see who it bit, why it spread, and the transferable lesson." />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="https://www.systemsfailed.dev/og-image.png" />
          <meta property="og:url" content="https://www.systemsfailed.dev" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content="https://www.systemsfailed.dev/og-image.png" />
        </Head>

        <Intro incidentCount={incidents.length} />
        <Masthead />

        {/* Hero */}
        <section className="oj-hero">
          <p className="oj-eyebrow">The record of the red bars</p>
          <h1 className="oj-h1">
            Every status page turns green again.<br />
            <em>This one doesn't.</em>
          </h1>
          <p className="oj-lede">
            {incidents.length} public engineering postmortems, kept on permanent record and
            indexed by <strong>how the system broke</strong> — not who it embarrassed.
            Pick a failure class; see who it bit, how it spread, and the one lesson
            worth stealing. Every entry links to the original writeup.
          </p>
        </section>

        {/* Master timeline strip */}
        <MasterStrip incidents={incidents} />

        {/* Filter board: companies or failure classes */}
        <FilterBoard
          incidents={incidents}
          active={active}
          onToggle={toggleFilter}
          initialMode={initialBoardMode}
        />

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
          <p>
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
          <p className="oj-foot-cta">
            Know one we're missing? The whole point is that the list keeps growing.
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
