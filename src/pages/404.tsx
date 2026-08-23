import { Link } from 'react-router-dom'
import { Head } from 'vite-react-ssg'
import { Masthead } from '../components/Masthead'
import { FAILURE_CLASS_KEYS, FAILURE_CLASSES } from '../../content/taxonomy'

export function Component() {
  return (
    <div className="oj-root">
      <Head>
        <title>404 — Page not found | systemsfailed.dev</title>
        <meta name="description" content="This page does not exist on systemsfailed.dev. Navigate to the incident archive, failure classes, or interview prep." />
        <meta name="robots" content="noindex" />
      </Head>

      <Masthead />

      <div className="oj-empty" style={{ marginTop: 80, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>404 — Page not found</h1>
        <p>
          No incident, no failure class, no lesson at this address.
        </p>

        <nav aria-label="Site navigation" style={{ marginTop: 24, textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Where to look next</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2 }}>
            <li><Link to="/">Homepage — browse the full incident archive</Link></li>
            <li><Link to="/interview">Interview prep — system design failure questions</Link></li>
            <li><a href="/sitemap.xml">Sitemap (XML) — all pages on this site</a></li>
            <li><a href="/llms.txt">llms.txt — machine-readable site guide</a></li>
            <li><a href="/feed.xml">RSS feed — latest incident additions</a></li>
          </ul>

          <h2 style={{ fontSize: '1.1rem', marginTop: 24, marginBottom: 12 }}>Failure classes</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2 }}>
            {FAILURE_CLASS_KEYS.map(key => (
              <li key={key}>
                <Link to={`/class/${key}`}>{FAILURE_CLASSES[key].label}</Link>
                {' — '}{FAILURE_CLASSES[key].desc}
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ marginTop: 32 }}>
          <Link to="/">
            <button>Back to the archive</button>
          </Link>
        </div>
      </div>
    </div>
  )
}
