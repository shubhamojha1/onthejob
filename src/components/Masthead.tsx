import { ThemeToggle } from './ThemeToggle'
import { SITE_SHARE_HREF } from '../lib/site'
import { NavLink, useLocation } from 'react-router-dom'

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
  const { pathname } = useLocation()
  const archiveIsActive =
    pathname === '/' || pathname.startsWith('/incident/') || pathname.startsWith('/class/')

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
        <div className="oj-nav-destinations">
          <a
            className={`oj-nav-link oj-nav-archive${archiveIsActive ? ' is-active' : ''}`}
            href="/#archive"
            aria-current={archiveIsActive ? 'page' : undefined}
          >
            Browse archive
          </a>
          <NavLink
            className={({ isActive }) => `oj-nav-link oj-nav-interview${isActive ? ' is-active' : ''}`}
            to="/interview"
            aria-label="Interview prep"
          >
            <span className="oj-nav-interview-full">Interview prep</span>
            <span className="oj-nav-interview-short">Prep</span>
          </NavLink>
        </div>
        <a className="oj-nav-share" href={SITE_SHARE_HREF} target="_blank" rel="noreferrer">
          Share on X <span aria-hidden>↗</span>
        </a>
        <ThemeToggle />
      </nav>
    </header>
  )
}
