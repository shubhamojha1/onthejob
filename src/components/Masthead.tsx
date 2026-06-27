import { FAILURE_CLASSES } from '../../content/taxonomy'
import incidentsData from '../generated/incidents-index.json'

const incidents = incidentsData
const yearMin = Math.min(...incidents.map((i: { year: number }) => i.year))
const yearMax = Math.max(...incidents.map((i: { year: number }) => i.year))

export function Masthead() {
  return (
    <header className="oj-mast">
      <a href="/" className="oj-wordmark">systemsfailed<span>.dev</span></a>
      <nav className="oj-mast-meta">
        <span>{incidents.length} incidents</span>
        <span className="oj-dot" />
        <span>{Object.keys(FAILURE_CLASSES).length} failure classes</span>
        <span className="oj-dot" />
        <span>{yearMin}–{yearMax}</span>
        <span className="oj-dot" />
        <span>by{' '}
          <a href="https://shubham-ojha.com" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Shubham Ojha</a>
        </span>
      </nav>
    </header>
  )
}
