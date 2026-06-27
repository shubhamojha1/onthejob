import { useLoaderData, useSearchParams } from 'react-router-dom'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Head } from 'vite-react-ssg'
import { FailureBoard } from '../components/FailureBoard'
import { Card } from '../components/Card'
import { Toolbar } from '../components/Toolbar'
import { getSearchIndex, searchIds } from '../lib/search'
import type { Incident } from '../schema/incident'
import { FAILURE_CLASSES } from '../../content/taxonomy'
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
    if (cls) initial.add(cls)
    if (pat) initial.add(pat)
    return initial
  })
  const [query, setQuery]   = useState('')
  const [sort, setSort]     = useState<'year' | 'az'>('year')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [searchIndex, setSearchIndex] = useState<MiniSearch | null>(null)

  // Load search index asynchronously — only runs in the browser
  useEffect(() => {
    getSearchIndex().then(setSearchIndex).catch(console.error)
  }, [])

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter(prev => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  const yearMin = useMemo(() => Math.min(...incidents.map(i => i.year)), [incidents])
  const yearMax = useMemo(() => Math.max(...incidents.map(i => i.year)), [incidents])

  const results = useMemo(() => {
    const q = query.trim()
    const matchIds = q && searchIndex ? searchIds(searchIndex, q) : null

    let list = incidents.filter(i => {
      if (active.size > 0) {
        const tags = [...i.classes, ...i.patterns]
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

  // ── Virtualized feed ────────────────────────────────────────────────────
  const feedRef = useRef<HTMLDivElement>(null)
  const parentOffsetRef = useRef(0)

  useEffect(() => {
    parentOffsetRef.current = feedRef.current?.offsetTop ?? 0
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => 244,
    overscan: 4,
    scrollMargin: parentOffsetRef.current,
  })

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className="oj-root">
        <Head>
          <meta charSet="UTF-8" />
          <title>Systems Failed</title>
        </Head>

        {/* Masthead */}
        <header className="oj-mast">
          <a href="/" className="oj-wordmark">systemsfailed<span>.dev</span></a>
          <nav className="oj-mast-meta">
            <span>{incidents.length} incidents</span>
            <span className="oj-dot" />
            <span>{Object.keys(FAILURE_CLASSES).length} failure classes</span>
            <span className="oj-dot" />
            <span>{yearMin}–{yearMax}</span>
          </nav>
        </header>

        {/* Hero */}
        <section className="oj-hero">
          <p className="oj-eyebrow">Postmortems, indexed by how things break</p>
          <h1 className="oj-h1">
            Engineers learn more from <em>failures</em><br />than from clean diagrams.
          </h1>
          <p className="oj-lede">
            A curated index of public engineering postmortems — not another list of links,
            but a map of <strong>how systems actually fail</strong>. Pick a failure class
            and see who it bit, why it spread, and the one transferable lesson.
            Every entry links to the original writeup.
          </p>
        </section>

        {/* Failure-class board */}
        <FailureBoard
          incidents={incidents}
          active={active}
          onToggle={key => toggle(setActive, key)}
        />

        {/* Toolbar + active pills */}
        <Toolbar
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          count={results.length}
          active={active}
          onRemoveFilter={tag => toggle(setActive, tag)}
          onClearAll={() => setActive(new Set())}
        />

        {/* Virtualized feed */}
        <main className="oj-feed" ref={feedRef}>
          {results.length === 0 ? (
            <div className="oj-empty">
              <p>No incidents match that filter yet.</p>
              <button onClick={() => { setActive(new Set()); setQuery('') }}>Reset</button>
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualItems.map(vItem => {
                const incident = results[vItem.index]
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
        </footer>
      </div>
  )
}
