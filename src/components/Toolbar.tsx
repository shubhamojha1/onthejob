import { FAILURE_CLASSES } from '../../content/taxonomy'

interface Props {
  query: string
  onQuery: (q: string) => void
  sort: 'year' | 'az'
  onSort: (s: 'year' | 'az') => void
  count: number
  active: Set<string>
  onRemoveFilter: (tag: string) => void
  onClearAll: () => void
}

export function Toolbar({
  query, onQuery, sort, onSort,
  count, active, onRemoveFilter, onClearAll,
}: Props) {
  return (
    <>
      <div className="oj-toolbar">
        <div className="oj-search">
          <SearchIcon />
          <input
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Search incidents, companies, patterns…"
            aria-label="Search incidents"
          />
          {query && (
            <button className="oj-clear" onClick={() => onQuery('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <div className="oj-toolbar-right">
          <span className="oj-count">{count} shown</span>
          <div className="oj-sort">
            <button className={sort === 'year' ? 'on' : ''} onClick={() => onSort('year')}>
              Newest
            </button>
            <button className={sort === 'az' ? 'on' : ''} onClick={() => onSort('az')}>
              A–Z
            </button>
          </div>
        </div>
      </div>

      {active.size > 0 && (
        <div className="oj-active">
          {[...active].map(tag => {
            const meta = FAILURE_CLASSES[tag as keyof typeof FAILURE_CLASSES]
            return (
              <button
                key={tag}
                className="oj-pill"
                style={{ '--c': meta ? meta.color : '#8B949E' } as React.CSSProperties}
                onClick={() => onRemoveFilter(tag)}
              >
                {meta ? meta.label : tag} <span className="oj-x">×</span>
              </button>
            )
          })}
          <button className="oj-clear-all" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      )}
    </>
  )
}

function SearchIcon() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
