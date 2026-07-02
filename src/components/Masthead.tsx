import { FAILURE_CLASSES } from '../../content/taxonomy'
import { ThemeToggle } from './ThemeToggle'
import incidentsData from '../generated/incidents-index.json'

const incidents = incidentsData
const yearMin = Math.min(...incidents.map((i: { year: number }) => i.year))
const yearMax = Math.max(...incidents.map((i: { year: number }) => i.year))

/** The brand mark: the favicon's tick strip, drawn inline so it follows the theme tokens. */
function LogoMark() {
  return (
    <svg className="oj-logo" viewBox="0 0 26 20" width="21" height="17" aria-hidden>
      <rect x="0" y="4" width="3.4" height="12" rx="1" />
      <rect x="5.6" y="4" width="3.4" height="12" rx="1" />
      <rect x="11.2" y="4" width="3.4" height="12" rx="1" />
      <rect className="hit" x="16.8" y="1" width="3.4" height="18" rx="1" />
      <rect x="22.4" y="4" width="3.4" height="12" rx="1" />
    </svg>
  )
}

export function Masthead() {
  return (
    <header className="oj-mast">
      <a href="/" className="oj-wordmark">
        <LogoMark />
        <span>systemsfailed<small>.dev</small></span>
      </a>
      <nav className="oj-mast-meta">
        <span>{incidents.length} incidents</span>
        <span className="oj-dot" />
        <span>{Object.keys(FAILURE_CLASSES).length} failure classes</span>
        <span className="oj-dot" />
        <span>{yearMin}–{yearMax}</span>
        <ThemeToggle />
      </nav>
    </header>
  )
}
