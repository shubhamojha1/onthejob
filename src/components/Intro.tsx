import { useEffect, useState } from 'react'

const SEEN_KEY = 'sf-intro-seen'
const TICKS = 28

/**
 * The opening moment: a status page dying. Green "all systems operational"
 * ticks cascade red, the banner flips to SYSTEMS FAILED, and the overlay
 * lifts to reveal the record. Plays once per session; reduced-motion users
 * never see it (CSS hides it entirely).
 */
export function Intro({ incidentCount }: { incidentCount: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (sessionStorage.getItem(SEEN_KEY)) return
    sessionStorage.setItem(SEEN_KEY, '1')
    setShow(true)
    const t = setTimeout(() => setShow(false), 2600)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <div className="oj-intro" aria-hidden>
      <div className="oj-intro-panel">
        <div className="oj-intro-status">
          <span className="oj-intro-label ok">
            <span className="oj-intro-dot" /> All systems operational
          </span>
          <span className="oj-intro-label down">
            <span className="oj-intro-dot" /> Systems failed
          </span>
        </div>
        <div className="oj-intro-strip">
          {Array.from({ length: TICKS }, (_, i) => (
            <i key={i} style={{ '--d': `${0.35 + i * 0.028}s` } as React.CSSProperties} />
          ))}
        </div>
        <p className="oj-intro-sub">{incidentCount} incidents on permanent record</p>
      </div>
    </div>
  )
}
