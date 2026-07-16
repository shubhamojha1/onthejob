import { ThemeToggle } from './ThemeToggle'
import { SITE_SHARE_HREF } from '../lib/site'

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
      <div className="oj-brand-lockup">
        <a href="/" className="oj-wordmark">
          <LogoMark />
          <span>systemsfailed<small>.dev</small></span>
        </a>
        <span className="oj-brand-tag">failure archive</span>
      </div>
      <nav className="oj-mast-meta" aria-label="Primary navigation">
        <a className="oj-nav-link" href="/#archive">Browse archive</a>
        <a className="oj-nav-share" href={SITE_SHARE_HREF} target="_blank" rel="noreferrer">
          Share on X <span aria-hidden>↗</span>
        </a>
        <ThemeToggle />
      </nav>
    </header>
  )
}
