import { FAILURE_CLASSES, colorForCompany } from '../../content/taxonomy'

// Company names are Title Case; failure classes and patterns are lowercase-kebab
const isCompanyTag = (tag: string) => /[A-Z ]/.test(tag)

const LIMIT_OPTIONS: (number | 'all')[] = [5, 10, 25, 'all']

interface Props {
  query: string
  onQuery: (q: string) => void
  sort: 'year' | 'az'
  onSort: (s: 'year' | 'az') => void
  count: number
  /** Full record size when the feed is capped; undefined when everything is shown */
  total?: number
  limit: number | 'all'
  onLimit: (l: number | 'all') => void
  /** The limit selector only applies to the default (unfiltered) view */
  showLimit: boolean
  active: Set<string>
  onRemoveFilter: (tag: string) => void
  onClearAll: () => void
}

export function Toolbar({
  query, onQuery, sort, onSort,
  count, total, limit, onLimit, showLimit,
  active, onRemoveFilter, onClearAll,
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
          <span className="oj-count">
            {total ? `latest ${count} of ${total}` : `${count} shown`}
          </span>
          {showLimit && (
            <label className="oj-limit">
              show
              <select
                value={String(limit)}
                onChange={e => onLimit(e.target.value === 'all' ? 'all' : +e.target.value)}
                aria-label="How many incidents to show"
              >
                {LIMIT_OPTIONS.map(o => (
                  <option key={o} value={String(o)}>
                    {o === 'all' ? 'all' : `latest ${o}`}
                  </option>
                ))}
              </select>
            </label>
          )}
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
            const color = meta ? meta.color : isCompanyTag(tag) ? colorForCompany(tag) : '#8B949E'
            return (
              <button
                key={tag}
                className="oj-pill"
                style={{ '--c': color } as React.CSSProperties}
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
