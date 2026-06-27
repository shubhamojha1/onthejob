import { Link } from 'react-router-dom'

export function Component() {
  return (
    <div className="oj-root">
      <header className="oj-mast">
        <a href="/" className="oj-wordmark">systemsfailed<span>.dev</span></a>
      </header>
      <div className="oj-empty" style={{ paddingTop: 80 }}>
        <p>Page not found.</p>
        <Link to="/">
          <button>Back to incidents</button>
        </Link>
      </div>
    </div>
  )
}
